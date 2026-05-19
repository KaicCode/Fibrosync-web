import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

type SelfCareIllustrationProps = {
  className?: string
}

export function SelfCareIllustration({ className }: SelfCareIllustrationProps) {
  return (
    <div className={cn('relative', className)}>
      <motion.div
        className="absolute left-4 top-12 h-10 w-10 rounded-full bg-brand-200/70 blur-xl"
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 6, ease: 'easeInOut', repeat: Number.POSITIVE_INFINITY }}
      />
      <motion.div
        className="absolute right-12 top-4 h-8 w-8 rounded-full bg-sky-200/80 blur-lg"
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 6.8, ease: 'easeInOut', repeat: Number.POSITIVE_INFINITY }}
      />
      <svg
        viewBox="0 0 520 460"
        className="relative h-full w-full drop-shadow-[0_28px_64px_rgba(92,77,164,0.16)]"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="leaf-purple" x1="58" y1="193" x2="143" y2="410" gradientUnits="userSpaceOnUse">
            <stop stopColor="#B79AFF" />
            <stop offset="1" stopColor="#8D68FF" />
          </linearGradient>
          <linearGradient id="leaf-blue" x1="349" y1="187" x2="448" y2="420" gradientUnits="userSpaceOnUse">
            <stop stopColor="#B7D6FF" />
            <stop offset="1" stopColor="#72A8FF" />
          </linearGradient>
          <linearGradient id="hair-soft" x1="177" y1="148" x2="318" y2="341" gradientUnits="userSpaceOnUse">
            <stop stopColor="#2B1E67" />
            <stop offset="1" stopColor="#4A2F94" />
          </linearGradient>
          <linearGradient id="dress-soft" x1="170" y1="260" x2="320" y2="416" gradientUnits="userSpaceOnUse">
            <stop stopColor="#C3AEFF" />
            <stop offset="1" stopColor="#9874FF" />
          </linearGradient>
          <linearGradient id="heart-core" x1="230" y1="319" x2="283" y2="374" gradientUnits="userSpaceOnUse">
            <stop stopColor="#A45DFF" />
            <stop offset="1" stopColor="#7B4DFF" />
          </linearGradient>
        </defs>

        <ellipse cx="248" cy="327" rx="171" ry="119" fill="#ECE6FF" />
        <ellipse cx="248" cy="341" rx="155" ry="108" fill="#F8F5FF" />

        <path
          d="M50 388C32 350 36 322 47 292C66 244 101 216 131 224C127 264 111 306 86 339C77 350 65 366 50 388Z"
          fill="url(#leaf-purple)"
          fillOpacity="0.8"
        />
        <path
          d="M95 397C89 362 94 332 106 305C116 284 132 264 148 254C151 292 148 319 137 346C127 368 113 384 95 397Z"
          fill="#D8C8FF"
        />
        <path
          d="M421 396C442 357 452 324 447 290C439 244 410 218 377 220C383 258 397 299 418 334C428 350 438 367 421 396Z"
          fill="url(#leaf-blue)"
          fillOpacity="0.9"
        />
        <path
          d="M365 397C364 368 370 340 382 315C392 293 409 273 426 263C427 289 423 316 412 343C401 367 387 384 365 397Z"
          fill="#B8CCFF"
        />

        <path
          d="M146 176C150 139 177 109 220 104C267 98 309 127 327 167C340 195 337 236 316 251C309 218 291 200 274 183C251 161 213 150 187 156C171 159 158 166 146 176Z"
          fill="url(#hair-soft)"
        />
        <path
          d="M224 158C257 155 286 176 295 211C301 235 294 271 277 287C258 305 224 307 201 289C181 272 170 245 173 216C176 186 194 162 224 158Z"
          fill="#FFD3C2"
        />
        <path
          d="M205 287C220 296 241 299 260 293C278 333 293 379 318 423C286 437 243 445 198 437C174 433 150 422 133 409C159 375 177 336 190 294C194 291 199 289 205 287Z"
          fill="url(#dress-soft)"
        />
        <path
          d="M178 292C157 316 143 346 133 409C111 398 99 386 96 366C93 345 104 321 127 300C141 287 160 280 178 292Z"
          fill="#B69DFF"
        />
        <path
          d="M287 292C308 316 321 347 318 423C345 407 358 392 361 371C365 347 353 321 330 301C318 290 302 283 287 292Z"
          fill="#A581FF"
        />

        <path
          d="M234 329C226 314 211 305 196 305C175 305 160 321 160 341C160 374 201 392 234 418C267 392 308 374 308 341C308 321 293 305 272 305C257 305 242 314 234 329Z"
          fill="url(#heart-core)"
        />

        <path
          d="M188 193C196 182 209 175 223 174C236 173 250 177 258 186"
          stroke="#FCEBE3"
          strokeWidth="4"
          strokeLinecap="round"
        />
        <path
          d="M248 231C241 238 228 240 217 236"
          stroke="#AA5966"
          strokeWidth="3.5"
          strokeLinecap="round"
        />

        <circle cx="77" cy="167" r="7" fill="#C5B2FF" />
        <circle cx="101" cy="119" r="5" fill="#D6C7FF" />
        <circle cx="406" cy="139" r="7" fill="#BDD3FF" />
        <circle cx="437" cy="256" r="9" fill="#CDC2FF" />
        <circle cx="398" cy="367" r="6" fill="#B1C7FF" />
        <circle cx="129" cy="371" r="6" fill="#C2B3FF" />
      </svg>
    </div>
  )
}
