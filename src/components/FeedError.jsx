export default function FeedError({ message, onRetry }) {
  return <div role="alert" className="arcade-panel m-6"><p>{message}</p>
    <button onClick={onRetry} className="arcade-button mt-4">Retry</button>
  </div>;
}
