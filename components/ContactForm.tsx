import React, { useState } from 'react';
import { Translation } from '../utils/translations';

interface ContactFormProps {
  t: Translation;
}

const ContactForm: React.FC<ContactFormProps> = ({ t }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert(t.contact.success);
    setFormData({ name: '', email: '', message: '' });
  };

  return (
    <div className="w-full max-w-7xl mx-auto py-20 px-4 sm:px-6 lg:px-8 animate-fadeIn">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-start">
        {/* Left Column: Info */}
        <div className="flex flex-col justify-start pt-4 lg:pt-10">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-gray-100 mb-8 leading-tight">
            {t.contact.title}
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 leading-relaxed max-w-lg">
            {t.contact.desc}
          </p>
          
          {/* Optional: Add decorative elements or contact info text if needed later */}
          <div className="mt-12 hidden lg:block">
            <div className="h-1 w-24 bg-green-600 rounded-full"></div>
          </div>
        </div>

        {/* Right Column: Form */}
        <div className="bg-white dark:bg-gray-800 p-10 md:p-12 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700 relative overflow-hidden">
            {/* Decorative background blur (optional aesthetic touch) */}
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-green-50 dark:bg-green-900/10 blur-3xl -z-10"></div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <label className="block text-base font-semibold text-gray-900 dark:text-gray-200 ml-1">
                  {t.contact.name}
                </label>
                <input
                  type="text"
                  required
                  placeholder={t.contact.namePlaceholder}
                  className="w-full px-5 py-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 text-base focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all shadow-sm"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="space-y-3">
                <label className="block text-base font-semibold text-gray-900 dark:text-gray-200 ml-1">
                  {t.contact.email}
                </label>
                <input
                  type="email"
                  required
                  placeholder={t.contact.emailPlaceholder}
                  className="w-full px-5 py-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 text-base focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all shadow-sm"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="block text-base font-semibold text-gray-900 dark:text-gray-200 ml-1">
                {t.contact.message}
              </label>
              <textarea
                required
                rows={6}
                placeholder={t.contact.messagePlaceholder}
                className="w-full px-5 py-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 text-base focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none resize-none transition-all shadow-sm"
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="w-full md:w-auto inline-flex justify-center items-center px-10 py-4 bg-[#004d40] hover:bg-[#003d33] text-white text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200"
              >
                {t.contact.submit}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ContactForm;