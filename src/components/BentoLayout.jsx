import React from 'react';
import { motion } from 'framer-motion';

// 1. The Animated Background
export const AuroraBackground = () => {
  return (
    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', overflow: 'hidden', zIndex: 0 }}>
      {[
        { color: '#8b5cf6', top: '-10%', left: '-10%' },
        { color: '#10b981', top: '20%', right: '-20%' },
        { color: '#3b82f6', bottom: '-20%', left: '20%' }
      ].map((blob, i) => (
        <motion.div
          key={i}
          style={{
            position: 'absolute',
            width: '30rem',
            height: '30rem',
            background: blob.color,
            borderRadius: '50%',
            filter: 'blur(80px)',
            opacity: 0.4,
            ...blob
          }}
          animate={{
            x: [0, 30, -30, 0],
            y: [0, -50, 30, 0],
            scale: [1, 1.1, 0.9, 1]
          }}
          transition={{
            duration: 10 + i * 2,
            repeat: Infinity,
            repeatType: 'reverse',
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
};

// 2. The Grid Container
export const BentoGrid = ({ children }) => {
  return (
    <div className="bento-grid">
      {children}
    </div>
  );
};

// 3. The Individual Card
export const BentoItem = ({ children, className, title, icon: Icon }) => {
  return (
    <motion.div 
      className={`bento-card ${className || ''}`}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      {title && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
          {Icon && <Icon size={20} color="#94a3b8" />}
          <h3 style={{ margin: 0, color: '#f8fafc', fontSize: '1.1rem' }}>{title}</h3>
        </div>
      )}
      {children}
    </motion.div>
  );
};