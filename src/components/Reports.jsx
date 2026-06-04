// src/components/Reports.jsx
import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, query, orderBy, addDoc, serverTimestamp, updateDoc, doc } from 'firebase/firestore';

function Reports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);

  useEffect(() => {
    const q = query(collection(db, 'reports'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedReports = snapshot.docs.map(d => ({
        id: d.id,
        ...d.data()
      }));
      setReports(fetchedReports);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleUpdateStatus = async (reportId, newStatus, additionalData = {}) => {
    try {
      await updateDoc(doc(db, 'reports', reportId), {
        status: newStatus,
        updatedAt: serverTimestamp(),
        ...additionalData
      });
      // Optionally update the local selected report state to reflect changes immediately
      setSelectedReport(prev => prev ? { ...prev, status: newStatus, ...additionalData } : null);
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Failed to update report status.");
    }
  };

  // 🚀 Handle Rejecting Fake Proof
  const handleRejectProof = (reportId) => {
    if (window.confirm("Are you sure you want to reject this proof? This will reopen the report on the public SOS feed.")) {
      handleUpdateStatus(reportId, 'pending', {
        proofImageUrl: null, // Clear the fake image
        helperId: null,      // Remove the troll helper
        helperName: null
      });
    }
  };

  const generateTestReport = async () => {
    setIsAdding(true);
    try {
      const reportTypes = ['Medical Emergency', 'Accident / Injury', 'Mother & Newborns'];
      const randomType = reportTypes[Math.floor(Math.random() * reportTypes.length)];

      await addDoc(collection(db, 'reports'), {
        incidentType: randomType,
        animalType: 'Dog',
        location: 'Colombo 07, near Viharamahadevi Park',
        description: 'This is a system-generated test report for layout testing.',
        status: 'pending',
        createdAt: serverTimestamp(),
        contact: '077 123 4567'
      });
    } catch (error) {
      console.error("Error generating test report:", error);
      alert("Failed to create test report.");
    } finally {
      setIsAdding(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'resolved': return 'bg-emerald-100 text-emerald-700';
      case 'in_progress': return 'bg-[#00A7E7]/10 text-[#00A7E7]';
      case 'reviewing': return 'bg-purple-100 text-purple-700';
      default: return 'bg-[#FF912C]/10 text-[#FF912C]'; // pending
    }
  };

  const getIconColor = (type) => {
    const t = type.toLowerCase();
    if (t.includes('medical') || t.includes('accident')) return 'bg-[#FF564F]';
    if (t.includes('starving') || t.includes('abuse')) return 'bg-[#FF912C]';
    return 'bg-[#00A7E7]';
  };

  return (
    <div className="space-y-6 relative font-['Urbanist']">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-4">
          <span className="w-12 h-12 rounded-xl bg-[#003459]/10 flex items-center justify-center text-[#003459] flex-shrink-0">
            <span className="material-symbols-outlined text-[26px]">report</span>
          </span>
          <h2 className="text-3xl font-black text-[#003459] font-['Poppins'] tracking-tight">Incident Reports</h2>
        </div>

        <button
          onClick={generateTestReport}
          disabled={isAdding}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#FF912C]/10 text-[#FF912C] font-extrabold rounded-full text-sm hover:bg-[#FF912C] hover:text-white transition-colors disabled:opacity-50 shadow-sm"
        >
          <span className="material-symbols-outlined text-[18px]">science</span>
          {isAdding ? 'Generating...' : 'Generate Test Report'}
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center p-10">
          <div className="flex items-center gap-3 text-[#52616B]">
            <span className="material-symbols-outlined animate-spin text-2xl">progress_activity</span>
            <span className="text-sm font-bold">Loading live reports...</span>
          </div>
        </div>
      ) : reports.length === 0 ? (
        <div className="bg-white/50 border-2 border-dashed border-[#003459]/10 rounded-[2rem] p-12 text-center flex flex-col items-center justify-center min-h-[300px]">
          <span className="material-symbols-outlined text-6xl text-[#52616B]/30 mb-4">inbox</span>
          <p className="text-[#52616B] font-bold text-lg">No reports have been filed yet.</p>
        </div>
      ) : (
        <div className="grid gap-5">
          {reports.map((report) => {
            const reportType = report.incidentType || report.type || 'Unknown';

            return (
              <div key={report.id} className="bg-white p-6 rounded-[2rem] border border-[#003459]/10 shadow-sm flex flex-col sm:flex-row justify-between sm:items-center gap-4 hover:shadow-md transition-shadow">

                <div className="flex items-start gap-5">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 text-white shadow-sm ${getIconColor(reportType)}`}>
                    <span className="material-symbols-outlined text-[28px]">emergency</span>
                  </div>

                  <div>
                    <h3 className="font-black text-[#003459] font-['Poppins'] text-xl capitalize tracking-tight mb-1">{reportType} Report</h3>
                    <p className="text-sm text-[#52616B] font-bold flex items-center gap-1.5 mt-1">
                      <span className="material-symbols-outlined text-[16px] text-[#52616B]/70">location_on</span>
                      {report.location}
                    </p>
                    <p className="text-sm text-[#00171F] font-medium mt-2 line-clamp-1 italic bg-stone-50 px-3 py-1.5 rounded-lg border border-[#003459]/5 inline-block">"{report.description}"</p>
                  </div>
                </div>

                <div className="flex sm:flex-col items-center sm:items-end justify-between gap-3 border-t sm:border-t-0 pt-4 sm:pt-0 border-[#003459]/10">
                  <span className={`px-3 py-1.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${getStatusColor(report.status)}`}>
                    {(report.status || 'Pending').replace('_', ' ')}
                  </span>

                  <button
                    onClick={() => setSelectedReport(report)}
                    className="text-xs font-extrabold text-[#00A7E7] hover:text-[#003459] transition-colors cursor-pointer flex items-center gap-1"
                  >
                    View & Action <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* ── REPORT DETAILS MODAL ── */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#00171F]/40 backdrop-blur-sm">
          <div className="bg-white rounded-[2.5rem] w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-300">

            <div className="flex justify-between items-center p-6 sm:p-8 border-b border-[#003459]/10 bg-stone-50">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[#003459] text-3xl">assignment</span>
                <h3 className="text-2xl font-black font-['Poppins'] text-[#003459] capitalize tracking-tight">
                  {selectedReport.incidentType || selectedReport.type}
                </h3>
              </div>
              <button onClick={() => setSelectedReport(null)} className="w-10 h-10 bg-white border border-[#003459]/5 rounded-full text-[#00171F] hover:bg-stone-100 transition-colors flex items-center justify-center shadow-sm">
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            <div className="p-6 sm:p-8 overflow-y-auto">
              {selectedReport.imageUrl ? (
                <div className="w-full h-64 rounded-[1.5rem] overflow-hidden mb-8 border border-[#003459]/10 shadow-sm">
                  <img src={selectedReport.imageUrl} alt="Report attachment" className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-full h-32 rounded-[1.5rem] bg-stone-50 mb-8 flex flex-col items-center justify-center border border-[#003459]/5">
                  <span className="material-symbols-outlined text-4xl text-[#52616B]/30 mb-2">image_not_supported</span>
                  <p className="text-sm text-[#52616B] font-bold">No photo provided</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-5">
                  <div>
                    <p className="text-[10px] font-extrabold text-[#52616B] uppercase tracking-widest mb-1.5">Location</p>
                    <p className="text-[#00171F] font-bold flex items-center gap-2">
                      <span className="material-symbols-outlined text-[18px] text-[#00A7E7]">map</span>
                      {selectedReport.location}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-extrabold text-[#52616B] uppercase tracking-widest mb-1.5">Animal Info</p>
                    <p className="text-[#00171F] font-bold capitalize bg-stone-50 px-3 py-1.5 rounded-lg border border-[#003459]/5 inline-block">
                      {selectedReport.animalType || 'Not specified'}
                    </p>
                  </div>
                </div>

                <div className="space-y-5">
                  <div>
                    <p className="text-[10px] font-extrabold text-[#52616B] uppercase tracking-widest mb-1.5">Contact Number</p>
                    <p className="text-[#00171F] font-bold flex items-center gap-2">
                      <span className="material-symbols-outlined text-[18px] text-[#00A7E7]">call</span>
                      {selectedReport.contact || 'No contact provided'}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-extrabold text-[#52616B] uppercase tracking-widest mb-1.5">Current Status</p>
                    <span className={`inline-block px-3 py-1.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${getStatusColor(selectedReport.status)}`}>
                      {(selectedReport.status || 'pending').replace('_', ' ')}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-8 border-t border-[#003459]/10">
                <p className="text-[10px] font-extrabold text-[#52616B] uppercase tracking-widest mb-3">Detailed Description</p>
                <div className="bg-stone-50 rounded-2xl p-5 border border-[#003459]/5">
                  <p className="text-[#00171F] font-medium leading-relaxed italic">"{selectedReport.description}"</p>
                </div>
              </div>

              {selectedReport.status === 'reviewing' && selectedReport.proofImageUrl && (
                <div className="mt-8 pt-8 border-t border-[#003459]/10">
                  <div className="bg-[#00A7E7]/5 border border-[#00A7E7]/20 rounded-2xl p-6">
                    <div className="flex items-center gap-2.5 mb-5">
                      <span className="material-symbols-outlined text-[#00A7E7] text-2xl">camera_check</span>
                      <h4 className="font-black font-['Poppins'] text-[#003459] text-lg tracking-tight">Proof of Rescue Submitted</h4>
                    </div>
                    <div className="w-full h-48 rounded-[1.25rem] overflow-hidden mb-5 border border-[#00A7E7]/20 shadow-sm">
                      <img src={selectedReport.proofImageUrl} alt="Proof of Rescue" className="w-full h-full object-cover" />
                    </div>
                    <p className="text-sm text-[#00171F] font-medium leading-relaxed">
                      <strong className="text-[#003459] font-black">{selectedReport.helperName || 'A community member'}</strong> has submitted this photo indicating the animal is secured. Please review and officially resolve this ticket.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 sm:p-8 border-t border-[#003459]/10 bg-stone-50 flex flex-wrap justify-between items-center gap-4">

              <div className="flex gap-3">
                {selectedReport.status !== 'in_progress' && selectedReport.status !== 'resolved' && selectedReport.status !== 'reviewing' && (
                  <button
                    onClick={() => handleUpdateStatus(selectedReport.id, 'in_progress')}
                    className="px-5 py-2.5 rounded-xl font-extrabold text-white bg-[#00A7E7] hover:bg-[#003459] transition-colors flex items-center gap-2 text-sm shadow-md"
                  >
                    <span className="material-symbols-outlined text-[18px]">local_shipping</span>
                    Dispatch Rescue
                  </button>
                )}

                {/* 🚀 Reject & Reopen Button */}
                {selectedReport.status === 'reviewing' && (
                  <>
                    <button
                      onClick={() => handleRejectProof(selectedReport.id)}
                      className="px-5 py-2.5 rounded-xl font-extrabold text-[#FF564F] bg-[#FF564F]/10 hover:bg-[#FF564F] hover:text-white transition-colors flex items-center gap-2 text-sm shadow-sm"
                    >
                      <span className="material-symbols-outlined text-[18px]">cancel</span>
                      Reject Proof
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(selectedReport.id, 'resolved')}
                      className="px-5 py-2.5 rounded-xl font-extrabold text-emerald-700 bg-emerald-100 hover:bg-emerald-600 hover:text-white transition-colors flex items-center gap-2 text-sm shadow-sm"
                    >
                      <span className="material-symbols-outlined text-[18px]">verified</span>
                      Verify & Resolve
                    </button>
                  </>
                )}

                {(selectedReport.status === 'pending' || selectedReport.status === 'in_progress') && (
                  <button
                    onClick={() => handleUpdateStatus(selectedReport.id, 'resolved')}
                    className="px-5 py-2.5 rounded-xl font-extrabold text-emerald-700 bg-emerald-100 hover:bg-emerald-600 hover:text-white transition-colors flex items-center gap-2 text-sm shadow-sm"
                  >
                    <span className="material-symbols-outlined text-[18px]">task_alt</span>
                    Mark Resolved
                  </button>
                )}
              </div>

              <div className="flex gap-3 ml-auto">
                <button
                  onClick={() => setSelectedReport(null)}
                  className="px-6 py-2.5 rounded-xl font-extrabold text-[#52616B] bg-white border border-[#003459]/10 hover:bg-stone-100 transition-colors text-sm shadow-sm"
                >
                  Close
                </button>
                <button className="px-6 py-2.5 rounded-xl font-extrabold text-white bg-[#003459] hover:bg-[#00A7E7] transition-colors flex items-center gap-2 text-sm shadow-md">
                  <span className="material-symbols-outlined text-[18px]">add_circle</span>
                  Register Animal
                </button>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Reports;