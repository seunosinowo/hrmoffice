import { CheckCircleIcon, StarIcon, ShieldCheckIcon, BoltIcon } from "@heroicons/react/24/solid";

export default function PricingPage() {
  const plans = [
    {
      name: "Starter",
      price: "$0",
      desc: "For individuals and small teams",
      features: [
        "Up to 10 employees",
        "Basic HR features",
        "Email support",
        "1GB storage"
      ],
      icon: <StarIcon className="h-8 w-8 text-yellow-400" />
    },
    {
      name: "Business",
      price: "$29",
      desc: "Growing organizations",
      features: [
        "Up to 100 employees",
        "Advanced analytics",
        "Priority support",
        "API access",
        "10GB storage"
      ],
      icon: <ShieldCheckIcon className="h-8 w-8 text-blue-500" />,
      popular: true
    },
    {
      name: "Enterprise",
      price: "Custom",
      desc: "Large corporations",
      features: [
        "Unlimited employees",
        "Dedicated account manager",
        "24/7 support",
        "On-premise options",
        "Custom integrations"
      ],
      icon: <BoltIcon className="h-8 w-8 text-purple-500" />
    }
  ];

  return (
    <div className="bg-gray-50 dark:bg-gray-900 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Choose the perfect plan for your organization's needs
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <div 
              key={plan.name} 
              className={`relative rounded-2xl shadow-lg overflow-hidden ${
                plan.popular 
                  ? "ring-2 ring-blue-500 dark:ring-blue-400 transform md:-translate-y-4" 
                  : "bg-white dark:bg-gray-800"
              }`}
            >
              {plan.popular && (
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                  Most Popular
                </div>
              )}
              <div className="p-8">
                <div className="flex items-center mb-6">
                  <div className="mr-4">{plan.icon}</div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{plan.name}</h3>
                    <p className="text-gray-600 dark:text-gray-300">{plan.desc}</p>
                  </div>
                </div>
                <div className="mb-8">
                  <p className="text-5xl font-bold text-gray-900 dark:text-white mb-2">{plan.price}</p>
                  {plan.price !== "Custom" && <p className="text-gray-500 dark:text-gray-400">per month</p>}
                </div>
                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start">
                      <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>
                <button
                  className={`w-full py-3 px-6 rounded-lg font-medium ${
                    plan.popular
                      ? "bg-blue-600 hover:bg-blue-700 text-white"
                      : "bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white"
                  }`}
                >
                  Get Started
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-20 bg-white dark:bg-gray-800 rounded-2xl p-10">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
            Frequently Asked Questions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <FAQItem 
              question="Can I change plans later?" 
              answer="Yes, you can upgrade or downgrade at any time." 
            />
            <FAQItem 
              question="Is there a free trial?" 
              answer="All paid plans come with a 14-day free trial." 
            />
            <FAQItem 
              question="What payment methods do you accept?" 
              answer="We accept all major credit cards and PayPal." 
            />
            <FAQItem 
              question="Do you offer discounts for non-profits?" 
              answer="Yes! Contact our sales team for special pricing." 
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function FAQItem({ question, answer }: { question: string, answer: string }) {
  return (
    <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">{question}</h3>
      <p className="text-gray-600 dark:text-gray-400">{answer}</p>
    </div>
  );
}