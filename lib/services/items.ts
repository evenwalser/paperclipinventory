import { supabase } from '../supabase';
import { Item, ItemImage } from '@/types/supabase';

export async function createItem(item: Omit<Item, 'id' | 'created_at'>) {
  const { data, error } = await supabase
    .from('items')
    .insert([item])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function uploadItemImage(file: File, itemId: string, displayOrder: number) {
  try {
    // Upload to Supabase Storage
    const fileExt = file.name.split('.').pop()
    const fileName = `${itemId}_${Date.now()}.${fileExt}`
    const filePath = `${itemId}/${fileName}`

    const { error: uploadError, data } = await supabase.storage
      .from('items')
      .upload(filePath, file)

    if (uploadError) throw uploadError

    // Get the public URL
    const { data: { publicUrl } } = supabase.storage
      .from('items')
      .getPublicUrl(filePath)

    // Create record in item_images table
    const { error: dbError } = await supabase
      .from('item_images')
      .insert({
        item_id: itemId,
        image_url: filePath,
        display_order: displayOrder
      })

    if (dbError) throw dbError

    return publicUrl
  } catch (error) {
    console.error('Error in uploadItemImage:', error)
    throw error
  }
}

export async function getItems(page: number = 1, itemsPerPage: number = 9) {
  const startIndex = (page - 1) * itemsPerPage;
  
  // Fetch count and items in parallel
  const [countResponse, itemsResponse] = await Promise.all([
    supabase
      .from('items')
      .select('*', { count: 'exact', head: true }),
    
    supabase
      .from('items')
      .select(`
        *,
        item_images!inner (
          image_url,
          display_order
        )
      `)
      .order('created_at', { ascending: false })
      .range(startIndex, startIndex + itemsPerPage - 1)
  ]);

  if (countResponse.error) throw countResponse.error;
  if (itemsResponse.error) throw itemsResponse.error;

  return {
    items: itemsResponse.data || [],
    totalItems: countResponse.count || 0,
    totalPages: Math.ceil((countResponse.count || 0) / itemsPerPage)
  };
}

export async function getItem(id: number) {
  const { data: item, error: itemError } = await supabase
    .from('items')
    .select('*')
    .eq('id', id)
    .single();

  if (itemError) throw itemError;

  const { data: images, error: imagesError } = await supabase
    .from('item_images')
    .select('image_url')
    .eq('item_id', id);

  if (imagesError) throw imagesError;

  return {
    ...item,
    images: images.map(img => img.image_url)
  };
}

export async function updateItem(id: number, updates: Partial<Item>) {
  const { data, error } = await supabase
    .from('items')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteItem(id: number) {
  // Delete associated images from storage first
  const { data: images } = await supabase
    .from('item_images')
    .select('image_url')
    .eq('item_id', id);

  if (images) {
    for (const image of images) {
      const path = image.image_url.split('/').pop();
      await supabase.storage
        .from('items')
        .remove([`item-images/${path}`]);
    }
  }

  const { error } = await supabase
    .from('items')
    .delete()
    .eq('id', id);

  if (error) throw error;
}