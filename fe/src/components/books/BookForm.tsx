import { useState } from "react";
import type { FormEvent } from "react";
import type { BookDto } from "../../types/book.d";

interface BookFormProps {
  initialData?: Partial<BookDto>;
  onSubmit: (data: Partial<BookDto>) => void;
}

const BookForm = ({ initialData = {}, onSubmit }: BookFormProps) => {
  const [formData, setFormData] = useState<Partial<BookDto>>(initialData);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 bg-white p-4 rounded-lg shadow-md"
    >
      <input
        type="text"
        name="title"
        placeholder="Title"
        value={formData.title || ""}
        onChange={handleChange}
        required
        className="border w-full p-2 rounded"
      />

      <input
        type="text"
        name="author"
        placeholder="Author"
        value={formData.author || ""}
        onChange={handleChange}
        className="border w-full p-2 rounded"
      />

      <textarea
        name="description"
        placeholder="Description"
        value={formData.description || ""}
        onChange={handleChange}
        className="border w-full p-2 rounded"
      />

      <input
        type="number"
        name="price_cents"
        placeholder="Price (cents)"
        value={formData.price_cents || ""}
        onChange={handleChange}
        required
        className="border w-full p-2 rounded"
      />

      <input
        type="number"
        name="stock"
        placeholder="Stock"
        value={formData.stock || ""}
        onChange={handleChange}
        className="border w-full p-2 rounded"
      />

      <button
        type="submit"
        className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
      >
        Save
      </button>
    </form>
  );
};

export default BookForm;
