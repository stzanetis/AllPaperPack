import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Category {
  id: number;
  name: string;
  description: string | null;
  parent_id: number | null;
}

interface Tag {
  id: number;
  name: string;
  description: string | null;
  color_hex: string | null;
}

interface CarouselImage {
  id: number;
  image_path: string;
  alt_text: string | null;
  link_url: string | null;
  display_order: number;
}

function getContrastColor(hexColor: string): string {
  const hex = hexColor.replace('#', '');
  let r = parseInt(hex.substring(0, 2), 16);
  let g = parseInt(hex.substring(2, 4), 16);
  let b = parseInt(hex.substring(4, 6), 16);

  // Calculate luminance
  const luminance = 0.299 * r + 0.587 * g + 0.114 * b;

  // If dark, brighten; if light, darken
  if (luminance < 128) {
    // Brighten by 60%
    r = Math.min(255, Math.floor(r + (255 - r) * 0.6));
    g = Math.min(255, Math.floor(g + (255 - g) * 0.6));
    b = Math.min(255, Math.floor(b + (255 - b) * 0.6));
  } else {
    // Darken by 60%
    r = Math.floor(r * 0.4);
    g = Math.floor(g * 0.4);
    b = Math.floor(b * 0.4);
  }

  const toHex = (v: number) => v.toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

const Index = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [carouselImages, setCarouselImages] = useState<CarouselImage[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const fetchCategories = async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('id,name,description,parent_id')
        .is('parent_id', null) // Only primary categories
        .order('name');

      if (!error && data) {
        setCategories(data as Category[]);
      }
    };

    const fetchTags = async () => {
      const { data, error } = await supabase
        .from('tags')
        .select('id,name,description,color_hex')
        .order('name');

      if (!error && data) {
        setTags(data as Tag[]);
      }
    };

    const fetchCarouselImages = async () => {
      const { data, error } = await supabase
        .from('carousel_images')
        .select('id,image_path,alt_text,link_url,display_order')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (!error && data) {
        setCarouselImages(data as CarouselImage[]);
      }
    };

    fetchCategories();
    fetchTags();
    fetchCarouselImages();
  }, []);

  // Carousel auto scrolling
  useEffect(() => {
    if (carouselImages.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % carouselImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [carouselImages.length]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % carouselImages.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + carouselImages.length) % carouselImages.length);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 text-center">
        {/* Hero Carousel */}
        <div className="relative mb-12 w-full max-w-7xl">
          {carouselImages.length > 0 ? (
            <>
              <div className="relative aspect-[28/9] overflow-hidden rounded-2xl">
              {carouselImages.map((image, index) => {
                const isActive = index === currentSlide;
                
                // If there's a link, wrap the image in a Link component
                if (image.link_url) {
                  const isExternal = image.link_url.startsWith('http');
                  if (isExternal) {
                    return (
                      <a
                        key={image.id}
                        href={image.link_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`absolute inset-0 cursor-pointer transition-opacity duration-500 ${
                          isActive ? 'opacity-100 z-10' : 'opacity-0 pointer-events-none z-0'
                        }`}
                      >
                        <img
                          src={image.image_path}
                          alt={image.alt_text || 'Carousel slide'}
                          className="w-full h-full object-cover"
                        />
                      </a>
                    );
                  } else {
                    return (
                      <Link
                        key={image.id}
                        to={image.link_url}
                        className={`absolute inset-0 cursor-pointer transition-opacity duration-500 ${
                          isActive ? 'opacity-100 z-10' : 'opacity-0 pointer-events-none z-0'
                        }`}
                      >
                        <img
                          src={image.image_path}
                          alt={image.alt_text || 'Carousel slide'}
                          className="w-full h-full object-cover"
                        />
                      </Link>
                    );
                  }
                }

                // No link - regular image
                return (
                  <img
                    key={image.id}
                    src={image.image_path}
                    alt={image.alt_text || 'Carousel slide'}
                    className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${
                      isActive ? 'opacity-100 z-0' : 'opacity-0 z-0'
                    }`}
                  />
                );
              })}
            </div>
            
            {carouselImages.length > 1 && (
              <>
                {/* Navigation arrows */}
                <button
                  onClick={prevSlide}
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white p-2 rounded-full transition-colors z-20"
                  aria-label="Previous slide"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button
                  onClick={nextSlide}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white p-2 rounded-full transition-colors z-20"
                  aria-label="Next slide"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>

                {/* Dots indicator */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20">
                  {carouselImages.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentSlide(index)}
                      className={`w-3 h-3 rounded-full transition-colors ${
                        index === currentSlide ? 'bg-white' : 'bg-white/50'
                      }`}
                      aria-label={`Go to slide ${index + 1}`}
                    />
                  ))}
                </div>
              </>
            )}
            </>
          ) : (
            <img
              src="/hero.png"
              className="w-full aspect-[28/9] object-cover rounded-lg"
            />
          )}
        </div>

        {/* Categories Section */}
        <div className="mb-6 flex items-center gap-3">
          <hr className="mt-1 flex-1 border-gray-300" aria-hidden />
          <h1 className="font-tinos text-[#0a3e06] text-3xl font-bold">Κατηγορίες</h1>
          <hr className="mt-1 flex-1 border-gray-300" aria-hidden />
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 mb-12">
          {categories.map((category) => (
            <Link key={category.id} to={`/products?category=${category.id}`}>
              <Button 
                className="rounded-2xl w-full h-28 flex flex-col justify-center items-center text-center whitespace-normal px-3 shadow-md transition-all duration-200 hover:scale-105"
                style={{
                  color: getContrastColor('#99b66b')
                }}
              >
                <span className="font-tinos text-2xl font-medium">{category.name}</span>
                <span className="text-sm break-words leading-snug">{category.description}</span>
              </Button>
            </Link>
          ))}
        </div>

        {/* Tags Section */}
        <div className="mb-6 flex items-center gap-3">
          <hr className="mt-1 flex-1 border-gray-300" aria-hidden />
          <h1 className="font-tinos text-[#0a3e06] text-3xl font-bold">Προτεινόμενα</h1>
          <hr className="mt-1 flex-1 border-gray-300" aria-hidden />
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 mb-12">
          {tags.map((tag) => (
            <Link key={tag.id} to={`/products?tag=${tag.id}`}>
              <div
                className="w-full h-36 rounded-2xl flex flex-col justify-center items-center text-center px-2 transition-all duration-200 hover:scale-105 shadow-md whitespace-normal hover:opacity-90"
                style={{
                  background: `linear-gradient(135deg, ${tag.color_hex} 0%, ${tag.color_hex}dd 100%)` || '#0a3e06',
                  color: getContrastColor(tag.color_hex || '#fdfdfdff')
                }}
              >
                <span className="font-tinos text-2xl">{tag.name}</span>
                {tag.description && (
                  <span className="text-sm break-words leading-snug opacity-90">{tag.description}</span>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Index;
