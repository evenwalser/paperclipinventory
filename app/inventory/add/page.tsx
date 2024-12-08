'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Camera, RotateCcw, Check, Upload, ChevronLeft, ChevronRight, X } from 'lucide-react'
import { CategorySelector } from "@/components/category-selector"
import Link from 'next/link'
import { analyzeImage } from "../../lib/together"
import { createItem, uploadItemImage } from '@/lib/services/items';
import { useRouter } from 'next/navigation';
import { resizeImage } from '@/lib/utils/imageProcessing'
import { ImageLightbox } from "../../components/ImageLightbox"
import { motion, AnimatePresence, Reorder } from "framer-motion"
import { ConditionSelector } from "../../components/ConditionSelector"
import { SizeSelector } from "../../components/SizeSelector"

const base64ToFile = async (base64String: string): Promise<File> => {
  const response = await fetch(base64String);
  const blob = await response.blob();
  return new File([blob], 'image.jpg', { type: 'image/jpeg' });
};

export default function AddItemPage() {
  const [images, setImages] = useState<string[]>([])
  const [isCameraActive, setIsCameraActive] = useState(false)
  const [isStartingCamera, setIsStartingCamera] = useState(false)
  const [isFlashing, setIsFlashing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [selectedCategories, setSelectedCategories] = useState({
    level1: "",
    level2: "",
    level3: "",
  })
  const [needsUserGesture, setNeedsUserGesture] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [itemDetails, setItemDetails] = useState({
    name: '',
    description: '',
    price: '',
    category: ''
  })
  const router = useRouter();
  const [isDragging, setIsDragging] = useState(false)
  const dropZoneRef = useRef<HTMLDivElement>(null)
  const [lightboxImage, setLightboxImage] = useState<string | null>(null)
  const [condition, setCondition] = useState<'New' | 'Like New' | 'Very Good' | 'Good' | 'Fair'>('New')
  const [size, setSize] = useState('')
  const [availableInStore, setAvailableInStore] = useState(true)
  const [listOnPaperclip, setListOnPaperclip] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    // Cleanup function
    return () => {
      if (videoRef.current?.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach(track => track.stop());
      }
    };
  }, []);

  const startCamera = async () => {
    setIsStartingCamera(true)
    try {
      // Set camera active first to ensure video element is rendered
      setIsCameraActive(true);

      // Small delay to ensure video element is mounted
      await new Promise(resolve => setTimeout(resolve, 100));

      if (!videoRef.current) {
        console.error('Video element not found');
        setIsCameraActive(false);
        return;
      }

      console.log('Starting camera...');
      const constraints = {
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'environment'
        },
        audio: false
      };
      
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log('Got media stream:', mediaStream);

      videoRef.current.srcObject = mediaStream;
      
      // Wait for video to be ready
      await new Promise((resolve) => {
        if (!videoRef.current) return;
        videoRef.current.onloadedmetadata = () => {
          console.log('Video ready to play');
          resolve(true);
        };
      });

      await videoRef.current.play();

    } catch (error) {
      console.error('Camera error:', error);
      setIsCameraActive(false);
      alert('Unable to access camera. Please make sure you have granted camera permissions.');
    } finally {
      setIsStartingCamera(false)
    }
  };

  const stopCamera = () => {
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setIsCameraActive(false)
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera()
    }
  }, [])

  const handleManualPlay = async () => {
    if (videoRef.current) {
      try {
        await videoRef.current.play();
        setNeedsUserGesture(false);
      } catch (error) {
        console.error('Manual play failed:', error);
      }
    }
  };

  const capturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current) {
      console.error('Video or canvas ref not available');
      return;
    }

    // Flash effect
    setIsFlashing(true);
    setTimeout(() => setIsFlashing(false), 150);

    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      if (!context) {
        console.error('Could not get canvas context');
        return;
      }

      // Set canvas size to match video dimensions
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Draw the current video frame
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Get the image data
      const imageDataUrl = canvas.toDataURL('image/jpeg', 0.8);

      // Add to images array
      setImages(prev => [...prev, imageDataUrl]);

      console.log('Photo captured successfully');

    } catch (error) {
      console.error('Error capturing photo:', error);
      alert('Failed to capture photo. Please try again.');
    }
  };

  const retakePhoto = () => {
    startCamera()
  }

  const analyzeImageWithAI = async (imageData: string) => {
    setIsAnalyzing(true);
    try {
      console.log('Starting image analysis...');
      const result = await analyzeImage(imageData);
      console.log('Analysis result:', result);

      setItemDetails(prev => ({
        ...prev,
        name: result.name || prev.name,
        description: result.description || prev.description,
        price: result.price?.toString() || prev.price,
        category: result.category || prev.category
      }));
      
      if (result.category) {
        setSelectedCategories(prev => ({
          ...prev,
          level1: result.category,
          level2: "",
          level3: ""
        }));
      }
    } catch (error) {
      console.error('Error in analyzeImageWithAI:', error);
      let errorMessage = 'Failed to analyze image. ';
      if (error instanceof Error) {
        errorMessage += error.message;
      } else {
        errorMessage += 'Please try again or fill in details manually.';
      }
      alert(errorMessage);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const usePhoto = async () => {
    if (images.length > 0) {
      const imageData = images[0];
      setImages(prev => prev.slice(1));
      setCurrentImageIndex(images.length);
      await analyzeImageWithAI(imageData);
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || !files[0]) return;

    try {
      console.log('Processing images...');
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.type.startsWith('image/')) {
          try {
            const resizedFile = await resizeImage(file);
            const base64Data = await new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => {
                if (typeof reader.result === 'string') {
                  resolve(reader.result);
                } else {
                  reject(new Error('Failed to convert image'));
                }
              };
              reader.onerror = () => reject(reader.error);
              reader.readAsDataURL(resizedFile);
            });

            setImages(prev => [...prev, base64Data]);
            // Set to first image if this is the first upload
            if (i === 0 && images.length === 0) {
              setCurrentImageIndex(0);
            }
          } catch (error) {
            console.error(`Error processing image ${file.name}:`, error);
            alert(`Failed to process image ${file.name}. Please try again.`);
          }
        }
      }
    } catch (error) {
      console.error('Error handling files:', error);
      alert('Failed to process images. Please try again.');
    }
  };

  const nextImage = () => {
    if (images.length > 0) {
      setCurrentImageIndex((prevIndex) => {
        const nextIndex = prevIndex + 1;
        return nextIndex >= images.length ? 0 : nextIndex;
      });
    }
  };

  const prevImage = () => {
    if (images.length > 0) {
      setCurrentImageIndex((prevIndex) => {
        const nextIndex = prevIndex - 1;
        return nextIndex < 0 ? images.length - 1 : nextIndex;
      });
    }
  };

  const handleSubmit = async () => {
    try {
      // Create the item in Supabase
      const item = await createItem({
        title: itemDetails.name,
        description: itemDetails.description || '',
        price: parseFloat(itemDetails.price),
        category: selectedCategories.level1,
        subcategory1: selectedCategories.level2 || null,
        subcategory2: selectedCategories.level3 || null,
        condition,
        size: size || null,
        status: 'available',
        available_in_store: availableInStore,
        list_on_paperclip: listOnPaperclip,
      });

      // Upload images to Supabase Storage
      await Promise.all(
        images.map(async (imageData, index) => {
          const file = await base64ToFile(imageData);
          return uploadItemImage(file, item.id, index);
        })
      );

      router.push('/inventory');
    } catch (error) {
      console.error('Failed to create item:', error);
      alert('Failed to create item. Please try again.');
    }
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const { files } = e.dataTransfer;
    if (files.length > 0) {
      console.log('Dropped files:', files.length); // Debug log
      await processFiles(files);
    }
  };

  const removeImage = (indexToRemove: number) => {
    setImages(prev => {
      const newImages = prev.filter((_, index) => index !== indexToRemove);
      // Adjust currentImageIndex if needed
      if (currentImageIndex >= newImages.length) {
        setCurrentImageIndex(Math.max(0, newImages.length - 1));
      } else if (indexToRemove < currentImageIndex) {
        setCurrentImageIndex(prev => Math.max(0, prev - 1));
      }
      return newImages;
    });
  };

  const handleReorder = (newOrder: string[]) => {
    const oldIndex = currentImageIndex;
    const oldImage = images[oldIndex];
    const newIndex = newOrder.findIndex(img => img === oldImage);
    
    setImages(newOrder);
    setCurrentImageIndex(newIndex);
  };

  const handleAIAnalysis = async (imageFile: File) => {
    setIsAnalyzing(true);
    try {
      console.log('Starting AI analysis...');
      const result = await analyzeImage(imageFile);
      console.log('AI analysis result:', result);

      // Update form with AI results
      setItemDetails({
        name: result.title || itemDetails.name,
        description: result.description || itemDetails.description,
        price: result.price_avg?.toString() || itemDetails.price,
        category: result.category_id || itemDetails.category
      });

      if (result.category_id) {
        setSelectedCategories(prev => ({
          ...prev,
          level1: result.category_id,
          level2: '',
          level3: ''
        }));
      }

      if (result.condition) {
        setCondition(result.condition as any);
      }

    } catch (error) {
      console.error('AI analysis failed:', error);
      alert('AI analysis failed. Please try filling in details manually.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-4 p-4">
      <Link href="/inventory" className="text-blue-500 hover:underline mb-4 inline-block">
        &larr; Return to Inventory
      </Link>
      <h1 className="text-3xl font-bold">Add New Item</h1>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Item Details</CardTitle>
            <Button
              onClick={async () => {
                if (images.length === 0) {
                  alert('Please upload at least one image first');
                  return;
                }

                setIsAnalyzing(true);
                try {
                  // Convert base64 image to File object
                  const imageFile = await base64ToFile(images[currentImageIndex]);
                  
                  // Send to AI for analysis
                  const result = await analyzeImage(imageFile);
                  
                  // Update form with AI results
                  setItemDetails({
                    name: result.title,
                    description: result.description,
                    price: result.price_avg.toString(),
                    category: result.category_id
                  });

                  // Update category if provided
                  if (result.category_id) {
                    setSelectedCategories(prev => ({
                      ...prev,
                      level1: result.category_id,
                      level2: "",
                      level3: ""
                    }));
                  }

                  // Update condition if provided
                  if (result.condition) {
                    setCondition(mapCondition(result.condition));
                  }

                } catch (error) {
                  console.error('AI analysis failed:', error);
                  alert('Failed to analyze image. You can continue filling in details manually.');
                } finally {
                  setIsAnalyzing(false);
                }
              }}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 
                         hover:to-purple-700 text-white shadow-lg"
              disabled={isAnalyzing || images.length === 0}
            >
              {isAnalyzing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/60 border-t-white mr-2" />
                  <span>Analyzing...</span>
                </>
              ) : (
                <>
                  <span className="text-lg mr-2">🤖</span>
                  <span>AI Listing Creation</span>
                </>
              )}
            </Button>
          </div>
          <CardDescription className="text-lg font-semibold">
            <span className="bg-gradient-to-r from-blue-500 to-purple-500 text-transparent bg-clip-text">
              Upload photos and let AI help create your listing
            </span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
          <div className="space-y-2">
            <Label htmlFor="image" className="text-base font-medium">Item Images</Label>
            
            {/* Main Image Capture Container */}
            <div className="w-full max-w-2xl mx-auto space-y-6">
              {isCameraActive ? (
                <div className="space-y-4">
                  {/* Camera View */}
                  <div className="bg-black rounded-2xl overflow-hidden">
                    <div className="aspect-[4/3] relative">
                      <video
                        ref={videoRef}
                        className="w-full h-full object-cover"
                        playsInline
                        muted
                      />
                      <canvas ref={canvasRef} className="hidden" />

                      {isFlashing && (
                        <div className="absolute inset-0 bg-white z-50 animate-flash" />
                      )}

                      {/* Capture Button */}
                      <div className="absolute bottom-6 left-0 right-0 flex justify-center">
                        <Button
                          onClick={capturePhoto}
                          className="w-16 h-16 rounded-full bg-white hover:bg-gray-100"
                        >
                          <div className="w-12 h-12 rounded-full border-4 border-black" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Thumbnails */}
                  <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-4">
                    {images.length > 0 ? (
                      <div className="flex gap-3 overflow-x-auto py-2 px-1">
                        {images.map((image, index) => (
                          <div key={index} className="relative flex-shrink-0 group">
                            <div className="w-20 h-20 rounded-lg overflow-hidden">
                              <img
                                src={image}
                                alt={`Capture ${index + 1}`}
                                className="w-full h-full object-cover"
                              />
                              <Button
                                variant="destructive"
                                size="icon"
                                className="absolute top-1 right-1 h-5 w-5 rounded-full opacity-0 group-hover:opacity-100"
                                onClick={() => removeImage(index)}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-400">
                        <p>Captured photos will appear here</p>
                      </div>
                    )}
                  </div>

                  {/* Done Button */}
                  <Button 
                    onClick={() => setIsCameraActive(false)}
                    variant="outline"
                    className="w-full"
                  >
                    Done
                  </Button>
                </div>
              ) : (
                /* Upload Buttons */
                <div className="grid grid-cols-2 gap-4">
                  <Button 
                    variant="outline" 
                    className="h-32 text-lg"
                    onClick={startCamera}
                    disabled={isStartingCamera}
                  >
                    {isStartingCamera ? (
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin h-5 w-5 border-2 border-current border-t-transparent rounded-full" />
                        <span>Starting Camera...</span>
                      </div>
                    ) : (
                      <>
                        <Camera className="mr-2 h-6 w-6" />
                        Take Photo
                      </>
                    )}
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-32 text-lg"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="mr-2 h-6 w-6" />
                    Choose Photo
                  </Button>
                </div>
              )}

              <input 
                ref={fileInputRef}
                type="file" 
                accept="image/*" 
                className="hidden" 
                onChange={handleFileChange}
                multiple
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">Item Name</Label>
            <Input 
              id="name" 
              value={itemDetails.name}
              onChange={(e) => setItemDetails(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter item name" 
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea 
              id="description" 
              value={itemDetails.description}
              onChange={(e) => setItemDetails(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Enter item description" 
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <CategorySelector
              selectedCategories={selectedCategories}
              onCategorySelect={setSelectedCategories}
            />
          </div>
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="condition" className="text-lg font-medium">Condition</Label>
              <ConditionSelector
                value={condition}
                onChange={setCondition}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="size" className="text-lg font-medium">Size</Label>
              <SizeSelector
                value={size}
                onChange={setSize}
                category={selectedCategories.level1}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="price">Price</Label>
            <Input 
              id="price" 
              type="number"
              value={itemDetails.price}
              onChange={(e) => setItemDetails(prev => ({ ...prev, price: e.target.value }))}
              placeholder="Enter price" 
            />
          </div>
          <div className="flex justify-center items-center space-x-8">
            <div className="flex items-center space-x-2">
              <Switch 
                id="available" 
                checked={availableInStore}
                onCheckedChange={setAvailableInStore}
                className="data-[state=checked]:bg-green-500 data-[state=unchecked]:bg-gray-200 
                           dark:data-[state=unchecked]:bg-gray-600"
              />
              <Label htmlFor="available" className="text-gray-700 dark:text-gray-200 font-semibold">
                Available in-store
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch 
                id="listOnPaperclip" 
                checked={listOnPaperclip}
                onCheckedChange={setListOnPaperclip}
                className="data-[state=checked]:bg-green-500 data-[state=unchecked]:bg-gray-200 
                           dark:data-[state=unchecked]:bg-gray-600"
              />
              <Label htmlFor="listOnPaperclip" className="text-gray-700 dark:text-gray-200 font-semibold">
                List On Paperclip
              </Label>
            </div>
          </div>
          <div className="px-6 py-4">
            <Button 
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="w-full text-lg font-semibold h-14 bg-gradient-to-r from-blue-600 to-purple-600 
                         hover:from-blue-700 hover:to-purple-700 text-white shadow-lg 
                         transform hover:scale-[1.02] transition-all duration-200"
            >
              <motion.div
                whileTap={{ scale: 0.95 }}
                className="flex items-center justify-center space-x-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/60 border-t-white" />
                    <span>Adding Item...</span>
                  </>
                ) : (
                  <>
                    <span>Add Item to Inventory</span>
                    <ChevronRight className="h-5 w-5" />
                  </>
                )}
              </motion.div>
            </Button>
          </div>
          {isAnalyzing && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl max-w-md w-full mx-4"
              >
                <div className="space-y-6">
                  {/* AI Icon Animation */}
                  <div className="flex justify-center">
                    <motion.div
                      animate={{
                        scale: [1, 1.1, 1],
                        rotate: [0, 5, -5, 0],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                      className="text-4xl"
                    >
                      🤖
                    </motion.div>
                  </div>

                  {/* Loading Text */}
                  <div className="text-center space-y-3">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                      AI Analysis in Progress
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Analyzing your item to create the perfect listing...
                    </p>
                  </div>

                  {/* Progress Bar */}
                  <div className="relative h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <motion.div
                      className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-600 to-purple-600"
                      animate={{
                        width: ["0%", "100%"],
                        x: ["-100%", "0%"]
                      }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    />
                  </div>

                  {/* Steps */}
                  <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                    <motion.div
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      ⚡ Identifying item characteristics...
                    </motion.div>
                    <motion.div
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
                    >
                      📝 Generating description...
                    </motion.div>
                    <motion.div
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 1.5, repeat: Infinity, delay: 1 }}
                    >
                      💰 Estimating market value...
                    </motion.div>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
          {lightboxImage && (
            <ImageLightbox
              src={lightboxImage}
              onClose={() => setLightboxImage(null)}
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}

