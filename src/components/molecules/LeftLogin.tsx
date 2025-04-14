import { Music, Ticket, DollarSign, Users, BarChart3 } from "lucide-react";
import Image from "next/image";
import { motion } from "framer-motion";

// Interface for BenefitItem props
interface BenefitItemProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}

// BenefitItem component
const BenefitItem = ({ icon: Icon, title, description }: BenefitItemProps) => (
  <motion.div 
    className="flex items-start space-x-3"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
  >
    <Icon className="w-6 h-6 mt-1 text-primary-700 flex-shrink-0" />
    <div>
      <p className="font-bold">{title}</p>
      <p className="text-gray-300">{description}</p>
    </div>
  </motion.div>
);

export default function LeftLogin() {
  const benefits = [
    {
      icon: Ticket,
      title: "Seamless ticketing, start to stage",
      description: "Effortless tools to create, promote, and sell tickets in minutes."
    },
    {
      icon: DollarSign,
      title: "Transparent pricing, no hidden fees",
      description: "Keep more of your earnings — and your fans happy too."
    },
    {
      icon: Users,
      title: "Built for artists & organizers",
      description: "Whether indie or major, our tools scale with your vision."
    },
    {
      icon: BarChart3,
      title: "Real-time insights & audience reach",
      description: "Track engagement, ticket sales, and grow your community."
    }
  ];

  return (
    <div className="relative w-full md:w-1/2 h-[50vh] md:h-screen">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <Image
          src="https://i.pinimg.com/1200x/fc/4b/79/fc4b7979b5310698b585bfce4ead1a4a.jpg" 
          alt="Concert atmosphere with crowd and stage lights"
          priority 
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-cover opacity-70"
        />
      </div>
      
      {/* Overlay for better text readability */}
      <div className="absolute inset-0 bg-black opacity-40 z-10"></div>

      {/* Left Side Content Container */}
      <div className="relative z-20 h-full flex items-center">
        {/* Brand and Benefits */}
        <div className="px-8 md:px-12 py-8 text-white max-w-xl">
          {/* Brand Name */}
          <motion.div 
            className="flex items-center mb-10"
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <Music className="w-8 h-8 mr-3 text-primary-700" />
            <h1 className="text-5xl font-bold font-brand">livewave</h1>
          </motion.div>

          {/* Benefits */}
          <div className="space-y-6">
            <motion.h2 
              className="text-xl font-display font-semibold mb-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              Why choose Livewave for your concert experience?
            </motion.h2>

            <div className="space-y-6">
              {benefits.map((benefit, index) => (
                <BenefitItem 
                  key={index}
                  icon={benefit.icon}
                  title={benefit.title}
                  description={benefit.description}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}