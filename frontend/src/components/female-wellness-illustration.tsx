import { motion } from 'framer-motion'

type FemaleWellnessIllustrationProps = {
  className?: string
}

export function FemaleWellnessIllustration({
  className,
}: FemaleWellnessIllustrationProps) {
  return (
    <div className={className}>
      <div className="relative mx-auto aspect-[0.86] w-full max-w-[28rem]">
        <motion.div
          className="absolute left-8 top-10 h-20 w-20 rounded-full bg-brand-300/40 blur-2xl"
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 6, repeat: Number.POSITIVE_INFINITY, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute right-8 top-20 h-24 w-24 rounded-full bg-sky-300/30 blur-3xl"
          animate={{ y: [0, 12, 0] }}
          transition={{ duration: 7, repeat: Number.POSITIVE_INFINITY, ease: 'easeInOut' }}
        />
        <div className="absolute inset-x-12 bottom-0 h-40 rounded-[50%] bg-brand-500/15 blur-3xl" />
        <svg
          viewBox="0 0 420 500"
          className="relative z-10 h-full w-full drop-shadow-[0_30px_80px_rgba(54,36,96,0.18)]"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="hair" x1="77" y1="74" x2="314" y2="393" gradientUnits="userSpaceOnUse">
              <stop stopColor="#31205F" />
              <stop offset="0.52" stopColor="#4A2C8E" />
              <stop offset="1" stopColor="#251744" />
            </linearGradient>
            <linearGradient id="skin" x1="220" y1="126" x2="285" y2="314" gradientUnits="userSpaceOnUse">
              <stop stopColor="#FFDCCB" />
              <stop offset="1" stopColor="#F6BCA2" />
            </linearGradient>
            <linearGradient id="dress" x1="152" y1="265" x2="289" y2="441" gradientUnits="userSpaceOnUse">
              <stop stopColor="#6E42FF" />
              <stop offset="1" stopColor="#432D98" />
            </linearGradient>
            <linearGradient id="smoke" x1="299" y1="135" x2="387" y2="416" gradientUnits="userSpaceOnUse">
              <stop stopColor="#E2D8FF" stopOpacity="0.85" />
              <stop offset="1" stopColor="#AF93FF" stopOpacity="0.2" />
            </linearGradient>
          </defs>

          <path
            d="M167 97C104 113 69 177 79 234C89 291 110 375 116 409C121 437 144 450 176 433C201 420 214 391 219 354C224 313 240 304 253 297C287 281 327 235 323 182C319 131 280 81 220 84C202 85 182 90 167 97Z"
            fill="url(#hair)"
          />
          <path
            d="M219 138C260 138 288 169 288 209C288 249 263 288 227 302C197 314 168 298 157 266C149 244 142 214 149 187C158 157 183 138 219 138Z"
            fill="url(#skin)"
          />
          <path
            d="M197 278C215 292 240 294 262 285C270 322 277 374 297 430C281 441 244 455 196 452C157 449 127 437 112 423C132 384 150 347 166 300C176 299 187 292 197 278Z"
            fill="url(#dress)"
          />
          <path
            d="M150 191C168 172 200 160 226 161C244 162 264 169 278 183C265 155 239 136 209 136C185 136 163 148 150 191Z"
            fill="#FFEDE2"
            fillOpacity="0.65"
          />
          <path
            d="M275 205C277 214 275 225 269 234C262 245 252 249 241 249"
            stroke="#9A5B5A"
            strokeWidth="4"
            strokeLinecap="round"
          />
          <path
            d="M178 216C190 214 200 219 207 229"
            stroke="#9A5B5A"
            strokeWidth="4"
            strokeLinecap="round"
          />
          <path
            d="M248 269C233 279 209 281 193 273"
            stroke="#A9557C"
            strokeWidth="4"
            strokeLinecap="round"
          />
          <path
            d="M114 217C84 261 63 314 56 378"
            stroke="url(#smoke)"
            strokeWidth="10"
            strokeLinecap="round"
          />
          <path
            d="M310 171C340 210 360 266 358 336"
            stroke="url(#smoke)"
            strokeWidth="10"
            strokeLinecap="round"
          />
          <path
            d="M316 111C347 141 369 183 379 238"
            stroke="url(#smoke)"
            strokeWidth="11"
            strokeLinecap="round"
          />
          <circle cx="77" cy="141" r="4" fill="#B88CFF" />
          <circle cx="53" cy="258" r="5" fill="#B88CFF" />
          <circle cx="347" cy="117" r="4" fill="#83B3FF" />
          <circle cx="373" cy="259" r="5" fill="#C59BFF" />
          <circle cx="96" cy="185" r="7" fill="#FFFFFF" fillOpacity="0.65" />
          <circle cx="346" cy="196" r="6" fill="#FFFFFF" fillOpacity="0.65" />
        </svg>
      </div>
    </div>
  )
}
