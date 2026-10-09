export default function FeedError({ message, onRetry }) {
  return <div role="alert" className="p-8 bg-white rounded-2xl"><p>{message}</p>
    <button onClick={onRetry} className="mt-4 p-3 bg-[#003459] text-white rounded-xl">Retry</button>
  </div>;
}
