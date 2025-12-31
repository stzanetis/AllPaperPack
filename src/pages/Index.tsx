import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';

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
  color: string;
}

const Index = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);

  useEffect(() => {
    const fetchCategories = async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('id,name,description,parent_id')
        .is('parent_id', null) // only primary categories
        .order('name');

      if (!error && data) {
        setCategories(data as Category[]);
      }
    };

    const fetchTags = async () => {
      const { data, error } = await supabase
        .from('tags')
        .select('id,name,description,color')
        .order('name');

      if (!error && data) {
        setTags(data as Tag[]);
      }
    };

    fetchCategories();
    fetchTags();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 text-center">
        {/* Hero */}
        <img
          src="/hero.jpg"
          alt="AllPaperPack hero"
          className="mx-auto mb-12 w-full max-w-6xl aspect-[28/9] object-cover rounded-lg"
        />

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
                className="w-full h-28 flex flex-col justify-center items-center text-center whitespace-normal px-3 hover:opacity-90 transition-all duration-200 hover:scale-105"
                style={{ 
                  background: 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary) / 0.8) 100%)',
                  boxShadow: '0 4px 15px hsl(var(--primary) / 0.2)'
                }}
              >
                <span className="font-tinos text-2xl">{category.name}</span>
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
              <Button 
                className="w-full h-36 flex flex-col justify-center items-center text-center whitespace-normal px-2 text-white hover:opacity-90 transition-all duration-200 hover:scale-105 rounded-md"
                style={{ 
                  background: `linear-gradient(135deg, ${tag.color} 0%, ${tag.color}dd 100%)`,
                  boxShadow: `0 4px 15px ${tag.color}40`
                }}
              >
                <span className="font-tinos text-2xl">{tag.name}</span>
                {tag.description && <span className="text-sm break-words leading-snug opacity-90">{tag.description}</span>}
              </Button>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Index;
