export default function Card({ children, className = '', padding = 'p-5' }) {
  return (
    <div
      className={`bg-white border border-gray-200 rounded-lg shadow-card ${padding} ${className}`}
    >
      {children}
    </div>
  )
}
