import './BentoLayout.css';

const BentoLayout = ({ children }) => {
  return (
    <div className="bento-grid">
      {children}
    </div>
  );
};

export default BentoLayout;