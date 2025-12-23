import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';

interface Category {
  id: string;
  name: string;
  description: string | null;
  parent_id: string | null;
}

const Index = () => {
  const [categories, setCategories] = useState<Category[]>([]);

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

    fetchCategories();
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

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 mb-12">
          {categories.map((category) => (
            <Link key={category.id} to={`/products?category=${category.id}`}>
              <Button className="w-full h-28 flex flex-col justify-center items-center text-center whitespace-normal px-3">
                <span className="font-tinos text-xl font-medium">{category.name}</span>
                <span className="text-sm break-words leading-snug">{category.description}</span>
              </Button>
            </Link>
          ))}
        </div>

        <div className="mb-6 flex items-center gap-3">
          <hr className="mt-1 flex-1 border-gray-300" aria-hidden />
          <h1 className="font-tinos text-[#0a3e06] text-3xl font-bold">Προτεινόμενα Προϊόντα</h1>
          <hr className="mt-1 flex-1 border-gray-300" aria-hidden />
        </div>

      </div>
      <div className="h-24"/>
    </div>
  );
};

export default Index;
