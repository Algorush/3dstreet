import { useState } from 'react';

const ImageUploadWidget = ({ handleImageUpload }) => {
  const [selectedImage, setSelectedImage] = useState(null);

  const handleImageChange = (event) => {
    const file = event.target.files[0];
    setSelectedImage(file);
  };

  const handleUploadClick = () => {
    if (selectedImage) {
      handleImageUpload(selectedImage);
      setSelectedImage(null); // Clear the selection after upload
    }
  };

  return (
    <div>
      <input type="file" accept="image/*" onChange={handleImageChange} />
      {selectedImage && (
        <div>
          <img src={URL.createObjectURL(selectedImage)} alt="Selected Image" style={{ maxWidth: '200px' }} />
        </div>
      )}
      <button onClick={handleUploadClick} disabled={!selectedImage}>
        Upload Image
      </button>
    </div>
  );
};

export { ImageUploadWidget };
