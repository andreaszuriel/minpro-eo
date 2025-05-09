'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Home,
  Music,
  AlertTriangle,
  Disc,
  RadioTower,
  Zap
} from 'lucide-react';

// Define the interface 
interface NoisePosition {
  topPosition: string;
  duration: number;
}

export default function NotFoundPage() {
  const [isGlitching, setIsGlitching] = useState(false);
  // Use the explicit type for the noisePositions state
  const [noisePositions, setNoisePositions] = useState<NoisePosition[]>([]);

  // Generate fixed positions for noise lines on client-side only
  useEffect(() => {
    // Generate fixed positions when component mounts (client-side only)
    setNoisePositions(
      Array.from({ length: 8 }).map(() => ({
        topPosition: `${Math.floor(Math.random() * 100)}%`,
        duration: Math.floor(Math.random() * 2) + 1
      }))
    );

    // Glitch effect interval
    const glitchInterval = setInterval(() => {
      setIsGlitching(true);
      setTimeout(() => setIsGlitching(false), 150);
    }, 3000);

    return () => clearInterval(glitchInterval);
  }, []);

  return (
    <div className="py-16 relative min-h-screen w-full bg-gray-900 text-gray-100 overflow-hidden">
      {/* Background noise effect - only render when positions are available (client-side) */}
      <div className="absolute inset-0 opacity-30">
        {noisePositions.map((pos, i) => (
          <motion.div
            key={i}
            className="absolute left-0 right-0 h-px bg-tertiary-400 opacity-40"
            initial={{ top: pos.topPosition, opacity: 0 }}
            animate={{
              top: [pos.topPosition, `${Math.floor(Math.random() * 100)}%`],
              opacity: [0, 0.4, 0]
            }}
            transition={{
              repeat: Infinity,
              duration: pos.duration,
              ease: "linear"
            }}
          />
        ))}
      </div>

      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-radial from-gray-800 to-black opacity-80" />

      {/* Spinning record background decoration */}
      <motion.div
        className="absolute -bottom-32 -right-32 opacity-10"
        animate={{ rotate: 360 }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
      >
        <Disc className="h-96 w-96 text-tertiary-400" />
      </motion.div>

      <motion.div
        className="absolute -top-32 -left-32 opacity-10"
        animate={{ rotate: -360 }}
        transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
      >
        <RadioTower className="h-96 w-96 text-primary-500" />
      </motion.div>

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-3xl mx-auto">
          {/* 404 Text */}
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mb-8 text-center"
          >
            <motion.div
              className={`text-8xl md:text-9xl lg:text-[12rem] font-black text-shadow-hard tracking-tighter flex justify-center ${isGlitching ? 'glitch' : ''}`}
              animate={{
                x: isGlitching ? [0, -3, 5, -2, 0] : 0,
                skewX: isGlitching ? [0, -2, 4, -3, 0] : 0
              }}
              transition={{ duration: 0.2 }}
            >
              <span className="text-tertiary-400">4</span>
              <span className="text-primary-500">0</span>
              <span className="text-tertiary-400">4</span>
            </motion.div>
          </motion.div>

          {/* Message */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mb-12 text-center"
          >
            <div className="relative inline-block transform bg-tertiary-400 px-6 py-3 -skew-x-6">
              <h2 className="text-2xl md:text-3xl font-black uppercase tracking-wider text-black">
                Stage Not Found
              </h2>

              {/* Lightning bolt decorations */}
              <Zap className="absolute -left-6 -top-4 h-8 w-8 text-primary-500" />
              <Zap className="absolute -right-6 -bottom-4 h-8 w-8 text-primary-500" />
            </div>

            <p className="mt-6 text-lg md:text-xl text-gray-300">
              Looks like this set isn't on our lineup. The band might have taken a different stage.
            </p>
          </motion.div>

          {/* Animated Illustration */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.6 }}
            className="relative mx-auto mb-12 w-60 h-60 md:w-80 md:h-80"
          >
            <motion.div
              animate={{
                y: [0, -15, 0],
                rotate: [-5, 5, -5]
              }}
              transition={{
                repeat: Infinity,
                duration: 6,
                ease: "easeInOut"
              }}
              className="relative"
            >
              <div className="absolute -inset-1 bg-tertiary-400 blur-md opacity-50" />
              <Image
                src="/api/placeholder/320/320"
                alt="Broken stage speaker"
                width={320}
                height={320}
                className="relative z-10 object-contain"
              />

              {/* Pulsing alert */}
              <motion.div
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.7, 1, 0.7]
                }}
                transition={{
                  repeat: Infinity,
                  duration: 2,
                }}
                className="absolute top-0 right-0 z-20 flex items-center justify-center bg-black rounded-full p-2"
              >
                <AlertTriangle className="h-8 w-8 text-tertiary-400" />
              </motion.div>
            </motion.div>
          </motion.div>

          {/* Action buttons */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.9 }}
            className="flex flex-col md:flex-row gap-4 justify-center"
          >
            <Link href="/" passHref>
              <Button className="cursor-pointer flex items-center gap-2 bg-tertiary-400 px-8 py-6 text-lg font-bold uppercase text-black transition-transform hover:scale-105 hover:bg-tertiary-300">
                <Home className="h-5 w-5" />
                Back to Main Stage
              </Button>
            </Link>

            <Link href="/events" passHref>
              <Button className="cursor-pointer flex items-center gap-2 border-2 border-primary-500 bg-transparent px-8 py-6 text-lg font-bold uppercase text-primary-500 transition-transform hover:scale-105 hover:bg-primary-500 hover:text-black">
                <Music className="h-5 w-5" />
                Browse Shows
              </Button>
            </Link>
          </motion.div>

          {/* Suggested links */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 1.2 }}
            className="mt-10 text-center"
          >
            <p className="text-gray-400">Or check out:</p>
            <div className="mt-4 flex flex-wrap justify-center gap-4">
              <Link href="/about" className="text-tertiary-400 hover:text-primary-300 underline underline-offset-4">
                About LiveWave
              </Link>
              <Link href="/terms" className="text-tertiary-400 hover:text-primary-300 underline underline-offset-4">
                Our Policies
              </Link>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Global Styles */}
      <style jsx global>{`
        .text-shadow-hard {
          text-shadow: 3px 3px 0px #000, -3px -3px 0px #000, 3px -3px 0px #000, -3px 3px 0px #000;
        }

        .bg-gradient-radial {
          background: radial-gradient(circle, var(--tw-gradient-from) 0%, var(--tw-gradient-to) 100%);
        }

        .glitch {
          position: relative;
          animation: glitch-skew 1s infinite linear alternate-reverse;
        }

        .glitch::before,
        .glitch::after {
          content: ""; /* Important: Ensure content is an empty string for pseudo-elements */
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          /* Inherit text content from parent for glitch effect to work on text */
          /* This is often done by setting the text content of pseudo-elements to attr(data-text) or similar, 
             but in your case, the glitch effect is applied to the container, and children are styled.
             The pseudo-elements here are for visual glitching artifacts (colored shadows/offsets). */
        }

        .glitch::before {
          left: 2px;
          text-shadow: -2px 0 #49FC00; /* Example color for green glitch */
          clip: rect(24px, 550px, 90px, 0);
          animation: glitch-anim 5s infinite linear alternate-reverse;
        }

        .glitch::after {
          left: -2px;
          text-shadow: -2px 0 #b393d3; /* Example color for purple glitch */
          clip: rect(85px, 550px, 140px, 0);
          animation: glitch-anim2 1s infinite linear alternate-reverse;
        }

        @keyframes glitch-anim {
          0% {
            clip: rect(65px, 9999px, 119px, 0);
            transform: skew(0.58deg);
          }
          5% {
            clip: rect(47px, 9999px, 23px, 0);
            transform: skew(0.45deg);
          }
          10% {
            clip: rect(5px, 9999px, 59px, 0);
            transform: skew(0.03deg);
          }
          15% {
            clip: rect(18px, 9999px, 59px, 0);
            transform: skew(0.07deg);
          }
          20% {
            clip: rect(10px, 9999px, 17px, 0);
            transform: skew(0.69deg);
          }
          25% {
            clip: rect(9px, 9999px, 98px, 0);
            transform: skew(0.41deg);
          }
          30% {
            clip: rect(71px, 9999px, 87px, 0);
            transform: skew(0.75deg);
          }
          35% {
            clip: rect(89px, 9999px, 4px, 0);
            transform: skew(0.34deg);
          }
          40% {
            clip: rect(7px, 9999px, 91px, 0);
            transform: skew(0.15deg);
          }
          45% {
            clip: rect(38px, 9999px, 33px, 0);
            transform: skew(0.76deg);
          }
          50% {
            clip: rect(67px, 9999px, 25px, 0);
            transform: skew(0.85deg);
          }
          55% {
            clip: rect(10px, 9999px, 56px, 0);
            transform: skew(0.4deg);
          }
          60% {
            clip: rect(67px, 9999px, 93px, 0);
            transform: skew(0.18deg);
          }
          65% {
            clip: rect(51px, 9999px, 67px, 0);
            transform: skew(0.55deg);
          }
          70% {
            clip: rect(70px, 9999px, 57px, 0);
            transform: skew(0.65deg);
          }
          75% {
            clip: rect(23px, 9999px, 46px, 0);
            transform: skew(0.36deg);
          }
          80% {
            clip: rect(98px, 9999px, 28px, 0);
            transform: skew(0.94deg);
          }
          85% {
            clip: rect(15px, 9999px, 40px, 0);
            transform: skew(0.2deg);
          }
          90% {
            clip: rect(60px, 9999px, 91px, 0);
            transform: skew(0.93deg);
          }
          95% {
            clip: rect(14px, 9999px, 96px, 0);
            transform: skew(0.12deg);
          }
          100% {
            clip: rect(48px, 9999px, 51px, 0);
            transform: skew(0.71deg);
          }
        }

        @keyframes glitch-anim2 {
          0% {
            clip: rect(86px, 9999px, 84px, 0);
            transform: skew(0.57deg);
          }
          5% {
            clip: rect(51px, 9999px, 31px, 0);
            transform: skew(0.92deg);
          }
          10% {
            clip: rect(55px, 9999px, 66px, 0);
            transform: skew(0.11deg);
          }
          15% {
            clip: rect(35px, 9999px, 51px, 0);
            transform: skew(0.13deg);
          }
          20% {
            clip: rect(92px, 9999px, 54px, 0);
            transform: skew(0.23deg);
          }
          25% {
            clip: rect(40px, 9999px, 86px, 0);
            transform: skew(0.41deg);
          }
          30% {
            clip: rect(59px, 9999px, 61px, 0);
            transform: skew(0.22deg);
          }
          35% {
            clip: rect(58px, 9999px, 92px, 0);
            transform: skew(0.85deg);
          }
          40% {
            clip: rect(94px, 9999px, 42px, 0);
            transform: skew(0.58deg);
          }
          45% {
            clip: rect(14px, 9999px, 23px, 0);
            transform: skew(0.19deg);
          }
          50% {
            clip: rect(40px, 9999px, 43px, 0);
            transform: skew(0.41deg);
          }
          55% {
            clip: rect(4px, 9999px, 44px, 0);
            transform: skew(0.24deg);
          }
          60% {
            clip: rect(60px, 9999px, 74px, 0);
            transform: skew(0.86deg);
          }
          65% {
            clip: rect(67px, 9999px, 36px, 0);
            transform: skew(0.99deg);
          }
          70% {
            clip: rect(84px, 9999px, 90px, 0);
            transform: skew(0.83deg);
          }
          75% {
            clip: rect(49px, 9999px, 17px, 0);
            transform: skew(0.18deg);
          }
          80% {
            clip: rect(32px, 9999px, 13px, 0);
            transform: skew(0.55deg);
          }
          85% {
            clip: rect(43px, 9999px, 81px, 0);
            transform: skew(0.18deg);
          }
          90% {
            clip: rect(95px, 9999px, 100px, 0);
            transform: skew(0.21deg);
          }
          95% {
            clip: rect(21px, 9999px, 83px, 0);
            transform: skew(0.35deg);
          }
          100% {
            clip: rect(64px, 9999px, 36px, 0);
            transform: skew(0.7deg);
          }
        }

        @keyframes glitch-skew {
          0% { transform: skew(0deg); }
          20% { transform: skew(0deg); }
          21% { transform: skew(3deg); }
          22% { transform: skew(0deg); }
          43% { transform: skew(0deg); }
          44% { transform: skew(-2deg); }
          45% { transform: skew(0deg); }
          65% { transform: skew(0deg); }
          66% { transform: skew(2deg); }
          67% { transform: skew(0deg); }
          87% { transform: skew(0deg); }
          88% { transform: skew(-1deg); }
          89% { transform: skew(0deg); }
          100% { transform: skew(0deg); }
        }
      `}</style>
    </div>
  );
}