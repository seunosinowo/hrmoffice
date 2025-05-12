function PageDescription() {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 p-8 dark:from-gray-800/50 dark:to-gray-900/50 dark:border dark:border-gray-800">
      <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\") " }}></div>

      <div className="relative">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-4">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white/90">
              HR Management System (Employee)
            </h1>
            <p className="max-w-2xl text-gray-600 dark:text-gray-400">
              Our Human Resources team is the heart of Soto Nigeria | Digital Energy, dedicated to fostering a vibrant and high-performing workforce. We empower our people, cultivate talent, and champion a culture of growth and innovation, ensuring every member of our team can contribute to shaping Nigeria's digital energy future
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PageDescription;