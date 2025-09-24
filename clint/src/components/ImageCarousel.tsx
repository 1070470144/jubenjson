import { useState } from 'react';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, CarouselApi } from './ui/carousel';
import { AspectRatio } from './ui/aspect-ratio';
import { Dialog, DialogContent, DialogTrigger } from './ui/dialog';
import { Button } from './ui/button';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { ZoomIn, X } from 'lucide-react';
import { useEffect } from 'react';

interface ImageCarouselProps {
  images: string[];
  title: string;
  className?: string;
  showThumbnails?: boolean;
  enableFullscreen?: boolean;
}

export function ImageCarousel({ 
  images, 
  title, 
  className = '', 
  showThumbnails = false,
  enableFullscreen = false 
}: ImageCarouselProps) {
  const [api, setApi] = useState<CarouselApi>();
  const [fullscreenApi, setFullscreenApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [fullscreenOpen, setFullscreenOpen] = useState(false);
  const [fullscreenIndex, setFullscreenIndex] = useState(0);

  useEffect(() => {
    if (!api) return;

    setCurrent(api.selectedScrollSnap());

    api.on('select', () => {
      setCurrent(api.selectedScrollSnap());
    });
  }, [api]);

  useEffect(() => {
    if (!fullscreenApi) return;

    setFullscreenIndex(fullscreenApi.selectedScrollSnap());

    fullscreenApi.on('select', () => {
      setFullscreenIndex(fullscreenApi.selectedScrollSnap());
    });
  }, [fullscreenApi]);

  const handleThumbnailClick = (index: number) => {
    if (api) {
      api.scrollTo(index);
    }
  };

  const openFullscreen = (index: number) => {
    setFullscreenIndex(index);
    setFullscreenOpen(true);
    // 当全屏打开时，将轮播定位到当前图片
    setTimeout(() => {
      if (fullscreenApi) {
        fullscreenApi.scrollTo(index);
      }
    }, 100);
  };

  // 键盘导航
  useEffect(() => {
    if (!fullscreenOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setFullscreenOpen(false);
      } else if (event.key === 'ArrowLeft' && fullscreenApi) {
        fullscreenApi.scrollPrev();
      } else if (event.key === 'ArrowRight' && fullscreenApi) {
        fullscreenApi.scrollNext();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [fullscreenOpen, fullscreenApi]);

  if (!images || images.length === 0) {
    return null;
  }

  return (
    <div className={className}>
      <Carousel setApi={setApi} className="w-full">
        <CarouselContent>
          {images.map((imageUrl, index) => (
            <CarouselItem key={index}>
              <div className="relative group">
                <AspectRatio ratio={16 / 9}>
                  <ImageWithFallback
                    src={imageUrl}
                    alt={`${title} 图片 ${index + 1}`}
                    className={`object-cover w-full h-full rounded-lg border ${
                      enableFullscreen ? 'cursor-pointer hover:brightness-110 transition-all' : ''
                    }`}
                    onClick={enableFullscreen ? () => openFullscreen(index) : undefined}
                  />
                </AspectRatio>
                {enableFullscreen && (
                  <Button
                    variant="secondary"
                    size="sm"
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      openFullscreen(index);
                    }}
                  >
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        {images.length > 1 && (
          <>
            <CarouselPrevious />
            <CarouselNext />
          </>
        )}
      </Carousel>

      {/* 轮播指示器 */}
      {images.length > 1 && (
        <div className="flex justify-center space-x-2 mt-3">
          {images.map((_, index) => (
            <button
              key={index}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === current ? 'bg-primary' : 'bg-muted-foreground/30'
              }`}
              onClick={() => handleThumbnailClick(index)}
            />
          ))}
        </div>
      )}

      {/* 缩略图导航 */}
      {showThumbnails && images.length > 1 && (
        <div className="mt-4">
          <div className="flex justify-center space-x-2 overflow-x-auto pb-2 px-4">
            {images.map((imageUrl, index) => (
              <button
                key={index}
                className="flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
                onClick={() => handleThumbnailClick(index)}
              >
                <AspectRatio 
                  ratio={16 / 9} 
                  className={`w-16 sm:w-20 overflow-hidden rounded border-2 transition-all ${
                    index === current 
                      ? 'border-primary shadow-md scale-105' 
                      : 'border-muted hover:border-primary/50 hover:scale-102'
                  }`}
                >
                  <ImageWithFallback
                    src={imageUrl}
                    alt={`缩略图 ${index + 1}`}
                    className={`object-cover w-full h-full transition-opacity ${
                      index === current ? 'opacity-100' : 'opacity-60 hover:opacity-80'
                    }`}
                  />
                </AspectRatio>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 图片信息 */}
      <div className="text-center text-sm text-muted-foreground mt-2">
        {images.length > 1 ? (
          <span>{current + 1} / {images.length} 张图片</span>
        ) : (
          <span>1 张图片</span>
        )}
      </div>

      {/* 全屏预览对话框 */}
      {enableFullscreen && (
        <Dialog open={fullscreenOpen} onOpenChange={setFullscreenOpen}>
          <DialogContent className="max-w-screen max-h-screen w-screen h-screen p-0 bg-black/90">
            <div className="relative w-full h-full flex items-center justify-center">
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-4 right-4 z-10 text-white hover:bg-white/20"
                onClick={() => setFullscreenOpen(false)}
              >
                <X className="h-6 w-6" />
              </Button>
              
              <Carousel setApi={setFullscreenApi} className="w-full h-full">
                <CarouselContent className="h-full">
                  {images.map((imageUrl, index) => (
                    <CarouselItem key={index} className="h-full flex items-center justify-center">
                      <div className="relative max-w-full max-h-full">
                        <ImageWithFallback
                          src={imageUrl}
                          alt={`${title} 大图 ${index + 1}`}
                          className="max-w-full max-h-full object-contain"
                        />
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                {images.length > 1 && (
                  <>
                    <CarouselPrevious className="left-4 text-white border-white/20 hover:bg-white/20" />
                    <CarouselNext className="right-4 text-white border-white/20 hover:bg-white/20" />
                  </>
                )}
              </Carousel>
              
              {/* 全屏模式下的图片计数 */}
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white text-sm bg-black/50 px-3 py-1 rounded">
                {fullscreenIndex + 1} / {images.length}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}