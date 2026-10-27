
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ImagePlus, X, ArrowLeft, Upload } from "lucide-react";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000";

const categories = [
  "Books",
  "Electronics",
  "Stationery",
  "Fashion",
  "Accessories",
  "Hostel Essentials",
  "Other",
];

export default function Sell() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    title: "",
    description: "",
    price: "",
    category: "Books",
    condition: "Good",
    college: "",
  });

  const [images, setImages] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const urls = images.map((file) =>
      URL.createObjectURL(file)
    );

    setPreviews(urls);

    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [images]);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  function handleImages(event) {
    const selected = Array.from(event.target.files || []);

    const allowed = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    const invalid = selected.find(
      (file) =>
        !allowed.includes(file.type) ||
        file.size > 5 * 1024 * 1024
    );

    if (invalid) {
      setError(
        "Please select JPG, PNG or WebP images under 5 MB each."
      );
      event.target.value = "";
      return;
    }

    if (images.length + selected.length > 5) {
      setError("You can upload a maximum of 5 photos.");
      event.target.value = "";
      return;
    }

    setImages((previous) => [...previous, ...selected]);
    setError("");
    event.target.value = "";
  }

  function removeImage(index) {
    setImages((previous) =>
      previous.filter((_, position) => position !== index)
    );
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (images.length === 0) {
      setError("Please upload at least one product photo.");
      return;
    }

    setLoading(true);

    try {
      const data = new FormData();

      Object.entries(form).forEach(([key, value]) => {
        data.append(key, value);
      });

      images.forEach((file) => {
        data.append("images", file);
      });

      const response = await fetch(
        `${API_URL}/api/products`,
        {
          method: "POST",
          credentials: "include",
          body: data,
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || "Unable to publish listing."
        );
      }

      navigate(`/product/${result.product._id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="sell-page">
      <div className="sell-container">
        <button
          type="button"
          className="sell-back"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft size={18} />
          Back
        </button>

        <div className="sell-heading">
          <span className="sell-eyebrow">
            CAMPUSMART MARKETPLACE
          </span>
          <h1>Give your things a new story.</h1>
          <p>
            List something you no longer need and help
            another student find their next favorite thing.
          </p>
        </div>

        <form
          className="sell-form"
          onSubmit={handleSubmit}
        >
          <section className="sell-section">
            <h2>Product photos</h2>
            <p>
              Add up to 5 photos. Your first photo will
              appear as the cover image.
            </p>

            <div className="sell-photo-grid">
              {previews.map((url, index) => (
                <div
                  className="sell-photo"
                  key={url}
                >
                  <img
                    src={url}
                    alt={`Product preview ${index + 1}`}
                  />

                  {index === 0 && (
                    <span className="sell-cover-label">
                      Cover
                    </span>
                  )}

                  <button
                    type="button"
                    className="sell-remove-photo"
                    onClick={() => removeImage(index)}
                    aria-label="Remove photo"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}

              {images.length < 5 && (
                <label className="sell-upload-box">
                  <ImagePlus size={30} />
                  <strong>Add photos</strong>
                  <span>JPG, PNG or WebP</span>

                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    onChange={handleImages}
                    hidden
                  />
                </label>
              )}
            </div>

            <p className="sell-photo-count">
              {images.length} of 5 photos selected
            </p>
          </section>

          <section className="sell-section">
            <h2>Product details</h2>

            <div className="sell-fields">
              <label>
                Product title
                <input
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  placeholder="e.g. Scientific Calculator"
                  maxLength={120}
                  required
                />
              </label>

              <label>
                Description
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="Tell buyers about your product..."
                  maxLength={3000}
                  rows={5}
                  required
                />
              </label>

              <div className="sell-field-row">
                <label>
                  Price (₹)
                  <input
                    name="price"
                    type="number"
                    min="1"
                    step="0.01"
                    value={form.price}
                    onChange={handleChange}
                    placeholder="499"
                    required
                  />
                </label>

                <label>
                  Category
                  <select
                    name="category"
                    value={form.category}
                    onChange={handleChange}
                  >
                    {categories.map((category) => (
                      <option key={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="sell-field-row">
                <label>
                  Condition
                  <select
                    name="condition"
                    value={form.condition}
                    onChange={handleChange}
                  >
                    <option>New</option>
                    <option>Like New</option>
                    <option>Good</option>
                    <option>Fair</option>
                  </select>
                </label>

                <label>
                  College
                  <input
                    name="college"
                    value={form.college}
                    onChange={handleChange}
                    placeholder="Your college name"
                  />
                </label>
              </div>
            </div>
          </section>

          {error && (
            <p className="sell-error" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="sell-publish"
            disabled={loading}
          >
            <Upload size={19} />
            {loading
              ? "Publishing..."
              : "Publish Listing"}
          </button>
        </form>
      </div>
    </main>
  );
}
