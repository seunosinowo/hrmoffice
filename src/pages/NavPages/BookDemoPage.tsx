import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeftIcon, CalenderIcon } from "../../icons";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import Select from "../../components/form/input/Select";

export default function BookDemoPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    role: "",
    date: "",
    time: "",
    attendees: "1-5",
    message: ""
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log("Demo booked:", formData);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="flex flex-col lg:flex-row h-full mt-16">
        {/* Left side - Why Book a Demo */}
        <div className="w-full lg:w-1/2 bg-white dark:bg-gray-800 p-8 lg:p-12">
          <div className="max-w-md mx-auto">
            <Link
              to="/"
              className="inline-flex items-center text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-300 dark:hover:text-white mb-6"
            >
              <ChevronLeftIcon className="size-5" />
              Back to homepage
            </Link>
            
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">Why Book a Demo?</h2>
            <div className="space-y-6">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">Personalized Walkthrough</h3>
                  <p className="mt-1 text-gray-500 dark:text-gray-400">
                    Get a tailored demonstration of our platform's features that match your specific needs.
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">Expert Guidance</h3>
                  <p className="mt-1 text-gray-500 dark:text-gray-400">
                    Learn from our product experts who can answer all your questions in real-time.
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">See It in Action</h3>
                  <p className="mt-1 text-gray-500 dark:text-gray-400">
                    Experience firsthand how our solution can streamline your workflow and boost productivity.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Form */}
        <div className="w-full lg:w-1/2 bg-gray-50 dark:bg-gray-900 p-8 lg:p-12">
          <div className="max-w-md mx-auto">
            <div className="mb-8">
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">Book a Demo</h1>
              <p className="text-gray-500 dark:text-gray-400">Schedule a personalized demo with our experts</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <Label>Full Name<span className="text-error-500">*</span></Label>
                  <Input
                    type="text"
                    name="name"
                    placeholder="Your name"
                    value={formData.name}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <Label>Email<span className="text-error-500">*</span></Label>
                  <Input
                    type="email"
                    name="email"
                    placeholder="your@email.com"
                    value={formData.email}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <Label>Company Name<span className="text-error-500">*</span></Label>
                  <Input
                    type="text"
                    name="company"
                    placeholder="Your company"
                    value={formData.company}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <Label>Your Role<span className="text-error-500">*</span></Label>
                  <Select
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    options={[
                      { value: "", label: "Select your role" },
                      { value: "executive", label: "Executive/C-Level" },
                      { value: "manager", label: "Manager" },
                      { value: "director", label: "Director" },
                      { value: "other", label: "Other" }
                    ]}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <Label>Preferred Date<span className="text-error-500">*</span></Label>
                  <div className="relative">
                    <Input
                      type="date"
                      name="date"
                      value={formData.date}
                      onChange={handleChange}
                      className="pl-3 pr-10 dark:text-white"
                    />
                    <CalenderIcon className="absolute right-3 top-1/2 -translate-y-1/2 size-5 text-gray-400 dark:text-gray-300 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <Label>Preferred Time<span className="text-error-500">*</span></Label>
                  <Input
                    type="time"
                    name="time"
                    value={formData.time}
                    onChange={handleChange}
                    className="w-full dark:text-white"
                  />
                </div>
              </div>

              <div>
                <Label>Number of Attendees</Label>
                <Select
                  name="attendees"
                  value={formData.attendees}
                  onChange={handleChange}
                  options={[
                    { value: "1-5", label: "1-5 people" },
                    { value: "6-10", label: "6-10 people" },
                    { value: "10+", label: "10+ people" }
                  ]}
                />
              </div>

              <div>
                <Label>Anything specific you'd like to see?</Label>
                <textarea
                  name="message"
                  rows={3}
                  className="w-full px-3 py-2 text-sm border rounded-lg border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:border-brand-500 focus:ring-brand-500"
                  placeholder="Tell us about your needs or questions..."
                  value={formData.message}
                  onChange={handleChange}
                ></textarea>
              </div>

              <button
                type="submit"
                className="w-full px-4 py-3 text-sm font-medium text-white transition rounded-lg bg-brand-500 shadow-theme-xs hover:bg-brand-600"
              >
                Schedule Demo
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}