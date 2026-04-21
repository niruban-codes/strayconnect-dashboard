// src/components/Reports.jsx
import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, query, orderBy, addDoc, serverTimestamp } from 'firebase/firestore';

function Reports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);

  // NEW: State to track which report is currently selected for the modal
  const [selectedReport, setSelectedReport] = useState(null);

  // Use onSnapshot for real-time updates
  useEffect(() => {
    const q = query(collection(db, 'reports'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedReports = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setReports(fetchedReports);
      setLoading(false);
    });

    return () => unsubscribe(); // Cleanup listener on unmount
  }, []);

  // 🧪 TEST FUNCTION: Generate a fake report
  const generateTestReport = async () => {
    setIsAdding(true);
    try {
      const reportTypes = ['lost', 'found', 'abuse'];
      const randomType = reportTypes[Math.floor(Math.random() * reportTypes.length)];

      await addDoc(collection(db, 'reports'), {
        type: randomType,
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

  return (
    <div className="space-y-6 relative">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <span className="w-10 h-10 rounded-full bg-tertiary-container flex items-center justify-center text-primary flex-shrink-0">
            <span className="material-symbols-outlined">report</span>
          </span>
          <h2 className="text-2xl font-bold text-primary font-headline">Incident Reports</h2>
        </div>

        {/* 🧪 TEST BUTTON */}
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
            // Handle both test reports (type) and mobile app reports (incidentType)
            const reportType = report.incidentType || report.type || 'Unknown';
            const isAbuse = reportType.toLowerCase() === 'abuse';
            const isLost = reportType.toLowerCase() === 'lost';

            return (
              <div key={report.id} className="bg-white p-6 rounded-2xl border border-outline-variant/20 shadow-sm flex flex-col sm:flex-row justify-between sm:items-center gap-4 hover:shadow-md transition-shadow">

                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 text-white font-bold
                    ${isAbuse ? 'bg-red-500' : isLost ? 'bg-amber-500' : 'bg-sky-500'}`}>
                    <span className="material-symbols-outlined">
                      {isAbuse ? 'warning' : isLost ? 'search' : 'pets'}
                    </span>
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
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider
                    ${report.status === 'resolved' ? 'bg-emerald-100 text-emerald-800' : 'bg-tertiary-container text-on-tertiary-container'}`}>
                    {report.status || 'Pending'}
                  </span>

                  {/* UPDATE: Added onClick to open the modal */}
                  <button
                    onClick={() => setSelectedReport(report)}
                    className="text-xs font-bold text-primary hover:underline cursor-pointer"
                  >
                    View Details
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

            {/* Modal Header */}
            <div className="flex justify-between items-center p-6 border-b border-outline-variant/20 bg-surface-container-lowest">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-primary text-2xl">assignment</span>
                <h3 className="text-xl font-bold font-headline text-primary capitalize">
                  {selectedReport.incidentType || selectedReport.type} Report Details
                </h3>
              </div>
              <button onClick={() => setSelectedReport(null)} className="p-2 bg-surface-variant rounded-full text-on-surface-variant hover:bg-outline-variant/30 transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto">
              {/* Check for image from mobile (imageUrl) or fallback */}
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
                    <p className="text-xs font-bold text-outline-variant uppercase tracking-wider mb-1">Reported On</p>
                    <p className="text-on-surface font-medium">
                      {selectedReport.createdAt?.toDate ? selectedReport.createdAt.toDate().toLocaleString() : 'Recently'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-outline-variant/20">
                <p className="text-xs font-bold text-outline-variant uppercase tracking-wider mb-2">Detailed Description</p>
                <div className="bg-surface-variant/30 rounded-xl p-4 border border-outline-variant/10">
                  <p className="text-on-surface leading-relaxed">{selectedReport.description}</p>
                </div>
              </div>

            </div>

            {/* Modal Footer Actions */}
            <div className="p-6 border-t border-outline-variant/20 bg-surface-container-lowest flex justify-end gap-3">
              <button
                onClick={() => setSelectedReport(null)}
                className="px-5 py-2.5 rounded-full font-bold text-primary bg-primary/10 hover:bg-primary/20 transition-colors"
              >
                Close
              </button>
              <button className="px-5 py-2.5 rounded-full font-bold text-white bg-primary hover:brightness-110 transition-colors flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">add_circle</span>
                Register Animal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Reports;