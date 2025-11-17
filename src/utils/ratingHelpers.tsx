// Helper function for custom star rendering
export const renderCustomStars = (rating: number, maxRating: number = 5) => {
  return [...Array(maxRating)].map((_, i) => (
    <span key={i} className={`text-sm ${i < Math.floor(rating) ? 'text-yellow-300' : 'text-white/30'}`}>
      ★
    </span>
  ));
};
