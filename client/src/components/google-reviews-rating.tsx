import { Star } from "lucide-react";

interface GoogleReviewsRatingProps {
  rating?: number | null;
  reviewCount?: number | null;
  showText?: boolean;
  size?: "sm" | "md" | "lg";
}

export default function GoogleReviewsRating({ 
  rating, 
  reviewCount, 
  showText = true, 
  size = "md" 
}: GoogleReviewsRatingProps) {
  if (!rating || rating === 0) {
    return null;
  }

  const sizeClasses = {
    sm: "h-3 w-3",
    md: "h-4 w-4", 
    lg: "h-5 w-5"
  };

  const textSizeClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base"
  };

  const renderStars = () => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    // Full stars
    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <Star 
          key={`full-${i}`} 
          className={`${sizeClasses[size]} fill-yellow-400 text-yellow-400`} 
        />
      );
    }
    
    // Half star
    if (hasHalfStar) {
      stars.push(
        <div key="half" className={`relative ${sizeClasses[size]}`}>
          <Star className={`${sizeClasses[size]} text-gray-300 absolute`} />
          <div className="overflow-hidden w-1/2">
            <Star className={`${sizeClasses[size]} fill-yellow-400 text-yellow-400`} />
          </div>
        </div>
      );
    }
    
    // Empty stars
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <Star 
          key={`empty-${i}`} 
          className={`${sizeClasses[size]} text-gray-300`} 
        />
      );
    }
    
    return stars;
  };

  return (
    <div className="flex items-center space-x-1">
      <div className="flex items-center space-x-0.5">
        {renderStars()}
      </div>
      {showText && (
        <div className={`${textSizeClasses[size]} text-gray-300 flex items-center space-x-1`}>
          <span className="font-medium">{rating.toFixed(1)}</span>
          {reviewCount && (
            <>
              <span>•</span>
              <span className="text-gray-400">
                {reviewCount.toLocaleString()} review{reviewCount !== 1 ? 's' : ''}
              </span>
            </>
          )}
        </div>
      )}
    </div>
  );
}