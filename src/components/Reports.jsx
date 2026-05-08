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

  // 🚀 NEW: Handle Rejecting Fake Proof
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
      case 'resolved': return 'bg-emerald-100 text-emerald-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'reviewing': return 'bg-indigo-100 text-indigo-800';
      default: return 'bg-amber-100 text-amber-800';
    }
  };

  const getIconColor = (type) => {
    const t = type.toLowerCase();
    if (t.includes('medical') || t.includes('accident')) return 'bg-red-500';
    if (t.includes('starving') || t.includes('abuse')) return 'bg-amber-500';
    return 'bg-sky-500';
  };

  return (
    <div className="space-y-6 relative">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <span className="w-10 h-10 rounded-full bg-tertiary-container flex items-center justify-center text-primary flex-shrink-0">
            <span className="material-symbols-outlined">report</span>
          </span>
          <h2 className="text-2xl font-bold text-primary font-headline">Incident Reports</h2>
        </div>

        <button
          onClick={generateTestReport}
          disabled={isAdding}
          className="flex items-center gap-2 px-4 py-2 bg-amber-100 text-amber-800 font-bold rounded-full text-sm hover:bg-amber-200 transition-colors disabled:opacity-50"
        >
          <span className="material-symbols-outlined text-sm">science</span>
          {isAdding ? 'Generating...' : 'Generate Test Report'}
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center p-10">
          <div className="flex items-center gap-3 text-on-surface-variant">
            <span className="material-symbols-outlined animate-spin">progress_activity</span>
            <span className="text-sm font-medium">Loading live reports...</span>
          </div>
        </div>
      ) : reports.length === 0 ? (
        <div className="bg-surface/50 border border-outline-variant/20 rounded-2xl p-10 text-center">
          <span className="material-symbols-outlined text-4xl text-stone-400 mb-2">inbox</span>
          <p className="text-on-surface-variant">No reports have been filed yet.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {reports.map((report) => {
            const reportType = report.incidentType || report.type || 'Unknown';

            return (
              <div key={report.id} className="bg-white p-6 rounded-2xl border border-outline-variant/20 shadow-sm flex flex-col sm:flex-row justify-between sm:items-center gap-4 hover:shadow-md transition-shadow">

                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 text-white font-bold ${getIconColor(reportType)}`}>
                    <span className="material-symbols-outlined">emergency</span>
                  </div>

                  <div>
                    <h3 className="font-bold text-on-surface capitalize">{reportType} Report</h3>
                    <p className="text-sm text-on-surface-variant flex items-center gap-1 mt-1">
                      <span className="material-symbols-outlined text-[14px]">location_on</span>
                      {report.location}
                    </p>
                    <p className="text-sm text-on-surface-variant/80 mt-2 line-clamp-1">"{report.description}"</p>
                  </div>
                </div>

                <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 border-t sm:border-t-0 pt-4 sm:pt-0 border-outline-variant/10">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${getStatusColor(report.status)}`}>
                    {(report.status || 'Pending').replace('_', ' ')}
                  </span>

                  <button
                    onClick={() => setSelectedReport(report)}
                    className="text-xs font-bold text-primary hover:underline cursor-pointer"
                  >
                    View & Action
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* ── REPORT DETAILS MODAL ── */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-sm">
          <div className="bg-surface rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">

            <div className="flex justify-between items-center p-6 border-b border-outline-variant/20 bg-surface-container-lowest">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-primary text-2xl">assignment</span>
                <h3 className="text-xl font-bold font-headline text-primary capitalize">
                  {selectedReport.incidentType || selectedReport.type}
                </h3>
              </div>
              <button onClick={() => setSelectedReport(null)} className="p-2 bg-surface-variant rounded-full text-on-surface-variant hover:bg-outline-variant/30 transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="p-6 overflow-y-auto">
              {selectedReport.imageUrl ? (
                <div className="w-full h-64 rounded-2xl overflow-hidden mb-6 bg-surface-variant border border-outline-variant/20">
                  <img src={selectedReport.imageUrl} alt="Report attachment" className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-full h-32 rounded-2xl bg-surface-variant mb-6 flex flex-col items-center justify-center border border-outline-variant/20">
                  <span className="material-symbols-outlined text-3xl text-outline-variant mb-2">image_not_supported</span>
                  <p className="text-sm text-on-surface-variant font-medium">No photo provided</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <p className="text-xs font-bold text-outline-variant uppercase tracking-wider mb-1">Location</p>
                    <p className="text-on-surface font-medium flex items-center gap-2">
                      <span className="material-symbols-outlined text-[16px] text-primary">map</span>
                      {selectedReport.location}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-outline-variant uppercase tracking-wider mb-1">Animal Info</p>
                    <p className="text-on-surface font-medium capitalize">
                      {selectedReport.animalType || 'Not specified'}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <p className="text-xs font-bold text-outline-variant uppercase tracking-wider mb-1">Contact Number</p>
                    <p className="text-on-surface font-medium flex items-center gap-2">
                      <span className="material-symbols-outlined text-[16px] text-primary">call</span>
                      {selectedReport.contact || 'No contact provided'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-outline-variant uppercase tracking-wider mb-1">Current Status</p>
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mt-1 ${getStatusColor(selectedReport.status)}`}>
                      {(selectedReport.status || 'pending').replace('_', ' ')}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-outline-variant/20">
                <p className="text-xs font-bold text-outline-variant uppercase tracking-wider mb-2">Detailed Description</p>
                <div className="bg-surface-variant/30 rounded-xl p-4 border border-outline-variant/10">
                  <p className="text-on-surface leading-relaxed">{selectedReport.description}</p>
                </div>
              </div>

              {selectedReport.status === 'reviewing' && selectedReport.proofImageUrl && (
                <div className="mt-6 pt-6 border-t border-outline-variant/20">
                  <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="material-symbols-outlined text-blue-700">camera_check</span>
                      <h4 className="font-bold text-blue-900">Proof of Rescue Submitted</h4>
                    </div>
                    <div className="w-full h-48 rounded-xl overflow-hidden mb-4 border border-blue-200 shadow-sm">
                      <img src={selectedReport.proofImageUrl} alt="Proof of Rescue" className="w-full h-full object-cover" />
                    </div>
                    <p className="text-sm text-blue-800">
                      <strong>{selectedReport.helperName || 'A community member'}</strong> has submitted this photo indicating the animal is secured. Please review and officially resolve this ticket.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-outline-variant/20 bg-surface-container-lowest flex flex-wrap justify-between items-center gap-3">

              <div className="flex gap-2">
                {selectedReport.status !== 'in_progress' && selectedReport.status !== 'resolved' && selectedReport.status !== 'reviewing' && (
                  <button
                    onClick={() => handleUpdateStatus(selectedReport.id, 'in_progress')}
                    className="px-4 py-2 rounded-full font-bold text-blue-700 bg-blue-100 hover:bg-blue-200 transition-colors flex items-center gap-2 text-sm"
                  >
                    <span className="material-symbols-outlined text-[18px]">local_shipping</span>
                    Dispatch Rescue
                  </button>
                )}

                {/* 🚀 NEW: Reject & Reopen Button */}
                {selectedReport.status === 'reviewing' && (
                  <>
                    <button
                      onClick={() => handleRejectProof(selectedReport.id)}
                      className="px-4 py-2 rounded-full font-bold text-red-700 bg-red-100 hover:bg-red-200 transition-colors flex items-center gap-2 text-sm shadow-sm"
                    >
                      <span className="material-symbols-outlined text-[18px]">cancel</span>
                      Reject Proof
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(selectedReport.id, 'resolved')}
                      className="px-4 py-2 rounded-full font-bold text-emerald-800 bg-emerald-200 hover:bg-emerald-300 transition-colors flex items-center gap-2 text-sm shadow-sm"
                    >
                      <span className="material-symbols-outlined text-[18px]">verified</span>
                      Verify & Resolve
                    </button>
                  </>
                )}

                {(selectedReport.status === 'pending' || selectedReport.status === 'in_progress') && (
                  <button
                    onClick={() => handleUpdateStatus(selectedReport.id, 'resolved')}
                    className="px-4 py-2 rounded-full font-bold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 transition-colors flex items-center gap-2 text-sm"
                  >
                    <span className="material-symbols-outlined text-[18px]">task_alt</span>
                    Mark Resolved
                  </button>
                )}
              </div>

              <div className="flex gap-2 ml-auto">
                <button
                  onClick={() => setSelectedReport(null)}
                  className="px-5 py-2.5 rounded-full font-bold text-on-surface-variant bg-surface-variant hover:bg-outline-variant/30 transition-colors text-sm"
                >
                  Close
                </button>
                <button className="px-5 py-2.5 rounded-full font-bold text-white bg-primary hover:brightness-110 transition-colors flex items-center gap-2 text-sm">
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