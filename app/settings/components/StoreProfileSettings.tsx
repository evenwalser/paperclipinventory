'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Upload } from 'lucide-react'

interface Address {
  line_1: string
  line_2: string
  post_town: string
  postcode: string
  county: string
}

export function StoreProfileSettings() {
  const [logo, setLogo] = useState<string | null>(null)
  const [storefrontImage, setStorefrontImage] = useState<string | null>(null)
  const [postcode, setPostcode] = useState('')
  const [addresses, setAddresses] = useState<Address[]>([])
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null)
  const [isManualEdit, setIsManualEdit] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [storeDetails, setStoreDetails] = useState({
    name: '',
    phone: '',
    email: ''
  })
  const [error, setError] = useState<string | null>(null)
  const [isValidPostcode, setIsValidPostcode] = useState(true)

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>, setter: (value: string | null) => void) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setter(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePostcodeLookup = async () => {
    setError(null);
    setAddresses([]);
    
    const postcodeRegex = /^[A-Z]{1,2}[0-9][A-Z0-9]? ?[0-9][A-Z]{2}$/i;
    if (!postcodeRegex.test(postcode)) {
      setIsValidPostcode(false);
      setError('Please enter a valid postcode');
      return;
    }
    
    setIsLoading(true);
    setIsValidPostcode(true);
    
    try {
      const formattedPostcode = postcode.replace(/\s/g, '');
      const response = await fetch(
        `https://api.ideal-postcodes.co.uk/v1/postcodes/${formattedPostcode}?api_key=ak_m4cyo8cboJvXHXWlphQPCNLYRAHfq`
      );
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to lookup postcode');
      }

      if (!data.result || data.result.length === 0) {
        setError('No addresses found for this postcode');
        return;
      }

      const formattedAddresses = data.result.map((item: any) => ({
        line_1: item.line_1 || '',
        line_2: item.line_2 || '',
        post_town: item.post_town || '',
        postcode: item.postcode || '',
        county: item.county || ''
      }));

      setAddresses(formattedAddresses);
      
      if (formattedAddresses.length === 1) {
        handleAddressSelect(formattedAddresses[0]);
      }
      
    } catch (error) {
      console.error('Error looking up postcode:', error);
      setError(error instanceof Error ? error.message : 'Failed to lookup postcode');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddressSelect = (address: Address) => {
    setSelectedAddress(address);
    setIsManualEdit(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Store Profile</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Store Images Section */}
        <div className="space-y-4">
          <Label>Store Images</Label>
          <div className="flex flex-col items-center space-y-4">
            <Label
              htmlFor="image-upload"
              className="cursor-pointer inline-flex items-center px-6 py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <Upload className="mr-2 h-5 w-5" />
              Upload Logo or Storefront Image
            </Label>
            <Input
              id="image-upload"
              type="file"
              accept="image/*"
              onChange={(e) => handleImageUpload(e, setLogo)}
              className="hidden"
              multiple
            />
          </div>
          <div className="flex flex-wrap gap-4 mt-4">
            {logo && (
              <div className="relative w-32 h-32">
                <img src={logo} alt="Store Logo" className="w-full h-full object-cover rounded" />
                <span className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs py-1 text-center">
                  Logo
                </span>
              </div>
            )}
            {storefrontImage && (
              <div className="relative w-32 h-32">
                <img src={storefrontImage} alt="Storefront" className="w-full h-full object-cover rounded" />
                <span className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs py-1 text-center">
                  Storefront
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Address Section */}
        <div className="space-y-4">
          <Label>Address</Label>
          <div className="flex gap-2">
            <div className="flex-1">
              <Input 
                placeholder="Enter postcode" 
                value={postcode} 
                onChange={(e) => {
                  setPostcode(e.target.value.toUpperCase());
                  setError(null);
                  setIsValidPostcode(true);
                }}
                className={!isValidPostcode ? 'border-red-500' : ''}
              />
              {error && (
                <p className="text-sm text-red-500 mt-1">{error}</p>
              )}
            </div>
            <Button 
              onClick={handlePostcodeLookup}
              disabled={isLoading || !postcode}
              className="min-w-[100px]"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Loading...
                </div>
              ) : (
                "Lookup"
              )}
            </Button>
          </div>

          {addresses.length > 0 && (
            <div className="space-y-2">
              <Label>Select your address</Label>
              <Select onValueChange={(value) => handleAddressSelect(JSON.parse(value))}>
                <SelectTrigger className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600">
                  <SelectValue placeholder="Choose an address" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                  {addresses.map((address, index) => (
                    <SelectItem 
                      key={index} 
                      value={JSON.stringify(address)}
                      className="hover:bg-gray-100 dark:hover:bg-gray-700 focus:bg-gray-100 dark:focus:bg-gray-700 cursor-pointer"
                    >
                      {[address.line_1, address.line_2, address.post_town]
                        .filter(Boolean)
                        .join(', ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {selectedAddress && (
            <div className="space-y-2">
              <Input 
                placeholder="Address Line 1" 
                value={selectedAddress.line_1}
                readOnly={!isManualEdit}
                onChange={(e) => setSelectedAddress({...selectedAddress, line_1: e.target.value})}
              />
              <Input 
                placeholder="Address Line 2" 
                value={selectedAddress.line_2}
                readOnly={!isManualEdit}
                onChange={(e) => setSelectedAddress({...selectedAddress, line_2: e.target.value})}
              />
              <Input 
                placeholder="Town/City" 
                value={selectedAddress.post_town}
                readOnly={!isManualEdit}
                onChange={(e) => setSelectedAddress({...selectedAddress, post_town: e.target.value})}
              />
              <Input 
                placeholder="County" 
                value={selectedAddress.county}
                readOnly={!isManualEdit}
                onChange={(e) => setSelectedAddress({...selectedAddress, county: e.target.value})}
              />
              <Input 
                placeholder="Postcode" 
                value={selectedAddress.postcode}
                readOnly={!isManualEdit}
                onChange={(e) => setSelectedAddress({...selectedAddress, postcode: e.target.value})}
              />
              <div className="flex justify-end">
                <Button variant="link" onClick={() => setIsManualEdit(!isManualEdit)}>
                  {isManualEdit ? 'Finish Editing' : 'Edit Manually'}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Store Details Section */}
        <div className="space-y-4">
          <Label>Store Details</Label>
          <Input 
            placeholder="Store Name" 
            value={storeDetails.name}
            onChange={(e) => setStoreDetails({...storeDetails, name: e.target.value})}
          />
          <Input 
            placeholder="Phone Number" 
            value={storeDetails.phone}
            onChange={(e) => setStoreDetails({...storeDetails, phone: e.target.value})}
          />
          <Input 
            placeholder="Store Email" 
            type="email"
            value={storeDetails.email}
            onChange={(e) => setStoreDetails({...storeDetails, email: e.target.value})}
          />
        </div>

        <Button className="w-full bg-[#FF3B30] hover:bg-[#E6352B] text-white">
          Save Changes
        </Button>
      </CardContent>
    </Card>
  )
} 