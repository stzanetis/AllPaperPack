import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import { Star } from 'lucide-react';

interface ProductTag {
  tag: {
    id: number;
    name: string;
  };
}

interface ProductCategory {
  category: {
    id: number;
    name: string;
    parent_id: number | null;
  };
}

interface Product {
  id: number;
  name: string;
  description: string | null;
  price: number;
  vat: number;
  image_url: string | null;
  stock: number;
  categoryInfo: {
    id: number;
    name: string;
    parent: { id: number; name: string } | null;
  } | null;
  tags: string[];
}

interface Review {
  review_id: number;
  user_name: string;
  score: number;
  comment: string | null;
}

export default function ProductDetails() {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const { addToCart } = useCart();
  const { user, dbUserId } = useAuth();
  const [qty, setQty] = useState(1);

  // Reviews state
  const [reviews, setReviews] = useState<Review[]>([]);
  const [avgScore, setAvgScore] = useState<number | null>(null);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [newReviewScore, setNewReviewScore] = useState(5);
  const [newReviewComment, setNewReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [hasUserReviewed, setHasUserReviewed] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;
      setLoading(true);
      
      // Fetch product basic info
      const { data: productData, error: productError } = await supabase
        .from('products')
        .select('id, name, description, price, vat, image_url, stock')
        .eq('id', parseInt(id))
        .single();

      if (productError || !productData) {
        setLoading(false);
        return;
      }

      // Fetch product categories (through junction table)
      const { data: categoryData } = await supabase
        .from('products_belong_to_categories')
        .select(`
          category:categories (
            id,
            name,
            parent_id
          )
        `)
        .eq('product_id', parseInt(id))
        .limit(1)
        .single();

      // Fetch parent category if exists
      let categoryInfo = null;
      if (categoryData?.category) {
        const cat = categoryData.category as { id: number; name: string; parent_id: number | null };
        if (cat.parent_id) {
          const { data: parentData } = await supabase
            .from('categories')
            .select('id, name')
            .eq('id', cat.parent_id)
            .single();
          
          categoryInfo = {
            id: cat.id,
            name: cat.name,
            parent: parentData ? { id: parentData.id, name: parentData.name } : null
          };
        } else {
          categoryInfo = {
            id: cat.id,
            name: cat.name,
            parent: null
          };
        }
      }

      // Fetch product tags (through junction table)
      const { data: tagsData } = await supabase
        .from('product_discribed_by_tags')
        .select(`
          tag:tags (
            id,
            name
          )
        `)
        .eq('product_id', parseInt(id));

      const tags = (tagsData || [])
        .map((t: any) => t.tag?.name)
        .filter((name: string | null): name is string => name !== null);

      setProduct({
        ...productData,
        categoryInfo,
        tags
      });
      setLoading(false);
    };
    fetchProduct();
  }, [id]);

  // Fetch reviews for this product
  useEffect(() => {
    const fetchReviews = async () => {
      if (!id) return;
      setReviewsLoading(true);

      // Fetch reviews using the user_reviews view
      const { data: reviewsData, error: reviewsError } = await supabase
        .from('user_reviews')
        .select('review_id, user_name, score, comment')
        .eq('product_id', parseInt(id));

      if (!reviewsError && reviewsData) {
        setReviews(reviewsData);
      }

      // Fetch average score
      const { data: avgData } = await supabase
        .from('avg_product_score')
        .select('avg_score')
        .eq('product_id', parseInt(id))
        .single();

      if (avgData?.avg_score) {
        setAvgScore(Number(avgData.avg_score));
      }

      // Check if current user has already reviewed
      if (dbUserId) {
        const { data: userReviewData } = await supabase
          .from('reviews')
          .select('id')
          .eq('user_id', dbUserId);

        if (userReviewData && userReviewData.length > 0) {
          // Check if any of those reviews are for this product
          const reviewIds = userReviewData.map(r => r.id);
          const { data: productReviewData } = await supabase
            .from('reviews_belong_to_products')
            .select('review_id')
            .eq('product_id', parseInt(id))
            .in('review_id', reviewIds);

          setHasUserReviewed((productReviewData?.length ?? 0) > 0);
        }
      }

      setReviewsLoading(false);
    };

    fetchReviews();
  }, [id, dbUserId]);

  const handleSubmitReview = async () => {
    if (!user || !id) {
      toast({
        title: 'Σφάλμα',
        description: 'Πρέπει να είστε συνδεδεμένοι για να αφήσετε κριτική.',
        variant: 'destructive',
      });
      return;
    }

    if (!dbUserId) {
      toast({
        title: 'Σφάλμα',
        description: 'Δεν βρέθηκε ο λογαριασμός σας. Παρακαλώ αποσυνδεθείτε και συνδεθείτε ξανά.',
        variant: 'destructive',
      });
      return;
    }

    if (hasUserReviewed) {
      toast({
        title: 'Σφάλμα',
        description: 'Έχετε ήδη αφήσει κριτική για αυτό το προϊόν.',
        variant: 'destructive',
      });
      return;
    }

    setSubmittingReview(true);
    try {
      // 1) Create the review
      const { data: reviewData, error: reviewError } = await supabase
        .from('reviews')
        .insert({
          user_id: dbUserId,
          score: newReviewScore,
          comment: newReviewComment || null,
        })
        .select()
        .single();

      if (reviewError) throw reviewError;

      // 2) Link review to product
      const { error: linkError } = await supabase
        .from('reviews_belong_to_products')
        .insert({
          review_id: reviewData.id,
          product_id: parseInt(id),
        });

      if (linkError) throw linkError;

      toast({
        title: 'Επιτυχία',
        description: 'Η κριτική σας καταχωρήθηκε!',
      });

      // Reset form and refresh reviews
      setNewReviewScore(5);
      setNewReviewComment('');
      setHasUserReviewed(true);

      // Refresh reviews
      const { data: newReviewsData } = await supabase
        .from('user_reviews')
        .select('review_id, user_name, score, comment')
        .eq('product_id', parseInt(id));

      if (newReviewsData) setReviews(newReviewsData);

      const { data: newAvgData } = await supabase
        .from('avg_product_score')
        .select('avg_score')
        .eq('product_id', parseInt(id))
        .single();

      if (newAvgData?.avg_score) setAvgScore(Number(newAvgData.avg_score));

    } catch (error) {
      console.error('Review error:', error);
      toast({
        title: 'Σφάλμα',
        description: 'Προέκυψε σφάλμα κατά την υποβολή της κριτικής.',
        variant: 'destructive',
      });
    } finally {
      setSubmittingReview(false);
    }
  };

  const renderStars = (score: number, interactive = false, size = 'w-4 h-4') => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${size} ${star <= score ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'} ${interactive ? 'cursor-pointer hover:scale-110 transition-transform' : ''}`}
            onClick={interactive ? () => setNewReviewScore(star) : undefined}
          />
        ))}
      </div>
    );
  };

  const handleAdd = async () => {
    if (!product) return;
    setAdding(true);
    await addToCart(product.id, qty);
    setAdding(false);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-10 grid gap-8 md:grid-cols-2">
        <Skeleton className="aspect-square w-full" />
        <div className="space-y-4">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-10 w-40" />
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        Το προϊόν δεν βρέθηκε.
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="grid gap-8 md:grid-cols-2">
        <div className="aspect-square overflow-hidden rounded-lg bg-muted">
          <img
            src={product.image_url || '/placeholder.png'}
            alt={product.name}
            className="h-full w-full object-cover"
          />
        </div>

        <div>
          {/* Breadcrumb: Category → Subcategory */}
          <div className="mb-3 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              {product.categoryInfo?.parent ? (
                <>
                  <Link
                    to={`/products?category=${product.categoryInfo.parent.id}`}
                    className="font-medium hover:text-primary"
                  >
                    {product.categoryInfo.parent.name}
                  </Link>
                  <span>/</span>
                  <Link
                    to={`/products?category=${product.categoryInfo.id}`}
                    className="hover:text-primary"
                  >
                    {product.categoryInfo.name}
                  </Link>
                </>
              ) : product.categoryInfo ? (
                <Link
                  to={`/products?category=${product.categoryInfo.id}`}
                  className="font-medium hover:text-primary"
                >
                  {product.categoryInfo.name}
                </Link>
              ) : null}
            </div>
          </div>

          {/* Product Name and Stock */}
          <h1 className="text-2xl md:text-3xl text-gray-800 font-semibold mb-2">{product.name}</h1>
          {/* Tags */}
          {product.tags && product.tags.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              {product.tags.map((tag) => (
                <Badge key={tag} variant="default">
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          {/* Price + Quantity */}
          <div className="my-8 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="w-64 h-16 bg-gray-100/70 rounded-full border flex items-center px-4">
              <span className="flex-1 text-center">
                <h1 className="text-2xl text-primary font-bold">{product.price.toFixed(2)}€</h1>
                <p className="text-sm">ΧΟΝΤΡΙΚΗ</p>
              </span>
              <div className="h-10 border-l border-gray-300 ml-4 mr-3" aria-hidden="true" />
              <span className="flex-1 text-center">
                <h1 className="text-xl text-gray-700 font-bold">
                  {(product.price + (product.price * product.vat * 0.01)).toFixed(2)}€
                </h1>
                <p className="text-sm">ΜΕ ΦΠΑ</p>
              </span>
            </div>

            <div className="flex items-center ml-20 gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                disabled={qty <= 1}
                className="bg-primary text-white rounded-full"
              >
                −
              </Button>
              <Input
                type="number"
                className="w-24 rounded-full text-center"
                value={qty}
                min={1}
                max={product.stock || undefined}
                onChange={(e) => {
                  const v = parseInt(e.target.value || '1', 10);
                  const max = Math.max(1, product.stock || 1);
                  setQty(Number.isNaN(v) ? 1 : Math.min(Math.max(1, v), max));
                }}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setQty((q) => Math.min(product.stock || q + 1, q + 1))}
                disabled={product.stock > 0 ? qty >= product.stock : false}
                className="bg-primary text-white rounded-full"
              >
                +
              </Button>
              <Badge className="h-10" variant={product.stock > 0 ? 'default' : 'destructive'}>
                {product.stock > 0 ? `${product.stock} σε απόθεμα` : 'Χωρίς απόθεμα'}
              </Badge>
            </div>
          </div>

          <Button
            onClick={handleAdd}
            disabled={product.stock === 0 || adding}
            className="w-full text-md rounded-full"
          >
            {adding ? 'Προσθήκη…' : 'Προσθήκη στο Καλάθι'}
          </Button>

          <p className="text-muted-foreground my-8 whitespace-pre-line">
            {product.description}
          </p>

          
        </div>
      </div>

      {/* Reviews Section */}
      <div className="mt-12 border-t pt-8">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          Κριτικές
          {avgScore !== null && (
            <span className="flex items-center gap-1 text-sm font-normal text-muted-foreground">
              ({avgScore.toFixed(1)} / 5 • {reviews.length} κριτικ{reviews.length === 1 ? 'ή' : 'ές'})
            </span>
          )}
        </h2>

        {/* Average Score Display */}
        {avgScore !== null && (
          <div className="flex items-center gap-2 mb-6">
            {renderStars(Math.round(avgScore), false, 'w-5 h-5')}
            <span className="text-lg font-medium">{avgScore.toFixed(1)}</span>
          </div>
        )}

        {/* Add Review Form */}
        {user && !hasUserReviewed && (
          <div className="mb-8 p-4 border rounded-lg bg-muted/30">
            <h3 className="font-medium mb-3">Γράψτε μια κριτική</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Βαθμολογία</label>
                {renderStars(newReviewScore, true, 'w-6 h-6')}
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Σχόλιο (προαιρετικό)</label>
                <Textarea
                  value={newReviewComment}
                  onChange={(e) => setNewReviewComment(e.target.value)}
                  placeholder="Πείτε μας την εμπειρία σας με αυτό το προϊόν..."
                  rows={3}
                />
              </div>
              <Button
                onClick={handleSubmitReview}
                disabled={submittingReview}
              >
                {submittingReview ? 'Υποβολή...' : 'Υποβολή Κριτικής'}
              </Button>
            </div>
          </div>
        )}

        {!user && (
          <div className="mb-6 p-4 border rounded-lg bg-muted/30 text-center">
            <p className="text-muted-foreground">
              <Link to="/auth" className="text-primary underline">Συνδεθείτε</Link> για να αφήσετε κριτική.
            </p>
          </div>
        )}

        {hasUserReviewed && (
          <div className="mb-6 p-4 border rounded-lg bg-green-50 text-green-700 text-center">
            Έχετε ήδη αφήσει κριτική για αυτό το προϊόν. Ευχαριστούμε!
          </div>
        )}

        {/* Reviews List */}
        {reviewsLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : reviews.length > 0 ? (
          <div className="space-y-4">
            {reviews.map((review) => (
              <div key={review.review_id} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">{review.user_name}</span>
                  {renderStars(review.score)}
                </div>
                {review.comment && (
                  <p className="text-muted-foreground">{review.comment}</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-center py-8">
            Δεν υπάρχουν κριτικές ακόμα. Γίνετε ο πρώτος που θα αφήσει μια κριτική!
          </p>
        )}
      </div>
    </div>
  );
}