// src/components/Reports.jsx
import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, query, orderBy, addDoc, serverTimestamp } from 'firebase/firestore';

function Reports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);

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
    <div className="space-y-6">
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
          {reports.map((report) => (
             <div key={report.id} className="bg-white p-6 rounded-2xl border border-outline-variant/20 shadow-sm flex flex-col sm:flex-row justify-between sm:items-center gap-4 hover:shadow-md transition-shadow">
               
               <div className="flex items-start gap-4">
                 <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 text-white font-bold
                   ${report.type === 'abuse' ? 'bg-red-500' : report.type === 'lost' ? 'bg-amber-500' : 'bg-sky-500'}`}>
                   <span className="material-symbols-outlined">
                     {report.type === 'abuse' ? 'warning' : report.type === 'lost' ? 'search' : 'pets'}
                   </span>
                 </div>
                 
                 <div>
                   <h3 className="font-bold text-on-surface capitalize">{report.type} Report</h3>
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
                 <button className="text-xs font-bold text-primary hover:underline">
                   View Details
                 </button>
               </div>
               
             </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Reports;