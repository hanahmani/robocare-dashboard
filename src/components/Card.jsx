export default function Card({ children, className = '', padding = 'p-5' }) {
  return (
    <div
      className={`bg-white border border-gray-200/90 rounded-2xl shadow-card hover:shadow-card-hover transition-all duration-200 ${padding} ${className}`}
    >
      {children}
    </div>
  )
}
