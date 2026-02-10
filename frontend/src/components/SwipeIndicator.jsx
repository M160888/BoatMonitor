const SwipeIndicator = ({ currentPage, totalPages }) => {
  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-10">
      <div className="flex items-center gap-2 bg-gray-800/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg">
        {/* Swipe hint */}
        <span className="text-xs text-gray-400 mr-2">← Swipe →</span>

        {/* Page indicators */}
        <div className="flex gap-2">
          {Array.from({ length: totalPages }).map((_, index) => (
            <div
              key={index}
              className={`h-2 rounded-full transition-all ${
                index === currentPage
                  ? 'w-6 bg-water-500'
                  : 'w-2 bg-gray-600'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

export default SwipeIndicator
