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
  // Upload to Supabase Storage
  const fileExt = file.name.split('.').pop();
  const fileName = `${itemId}_${Date.now()}.${fileExt}`;
  const filePath = `item-images/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('items')
    .upload(filePath, file);

  if (uploadError) throw uploadError;

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('items')
    .getPublicUrl(filePath);

  // Create record in item_images table
  const { error: dbError } = await supabase
    .from('item_images')
    .insert([{
      item_id: itemId,
      image_url: publicUrl,
      display_order: displayOrder
    }]);

  if (dbError) throw dbError;

  return publicUrl;
}

export async function getItems() {
  const { data: items, error: itemsError } = await supabase
    .from('items')
    .select(`
      *,
      item_images (
        image_url,
        display_order
      )
    `)
    .order('created_at', { ascending: false });

  if (itemsError) throw itemsError;

  return items;
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