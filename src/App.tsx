import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client';

interface Category {
  id: string;
  name: string;
  description: string | null;
  parent_id: string | null;
}

function App() {
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
    <div>
      <h1>TEST</h1>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 mb-12">
        {categories.map((category) => (
          <div key={category.id}>
            <h1 className="font-tinos text-xl font-medium">{category.name}</h1>
            <h2 className="text-sm break-words leading-snug">{category.description}</h2>
          </div>
        ))}
      </div>
    </div>
  )
}

export default App
