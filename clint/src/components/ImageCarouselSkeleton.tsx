import { AspectRatio } from './ui/aspect-ratio';
import { Skeleton } from './ui/skeleton';

interface ImageCarouselSkeletonProps {
  className?: string;
  showThumbnails?: boolean;
}

export function ImageCarouselSkeleton({ 
  className = '', 
  showThumbnails = false 
}: ImageCarouselSkeletonProps) {
  return (
    <div className={className}>
      {/* 主图片骨架 */}
      <AspectRatio ratio={16 / 9}>
        <Skeleton className="w-full h-full rounded-lg" />
      </AspectRatio>

      {/* 轮播指示器骨架 */}
      <div className="flex justify-center space-x-2 mt-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={index} className="w-2 h-2 rounded-full" />
        ))}
      </div>

      {/* 缩略图骨架 */}
      {showThumbnails && (
        <div className="mt-4">
          <div className="flex justify-center space-x-2 overflow-x-auto pb-2 px-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="flex-shrink-0">
                <AspectRatio ratio={16 / 9} className="w-16 sm:w-20">
                  <Skeleton className="w-full h-full rounded border" />
                </AspectRatio>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 图片信息骨架 */}
      <div className="text-center mt-2">
        <Skeleton className="h-4 w-16 mx-auto" />
      </div>
    </div>
  );
}