import { Check } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { oauthStartUrl } from "@/lib/api"

const FEATURES = [
  "Sync across devices",
  "Focus stats and history",
  "Custom timer modes",
  "Reminders",
  "Early access to new features",
]

type Props = {
  trigger: React.ReactNode
}

export function LoginModal({ trigger }: Props) {
  return (
    <Dialog>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-3xl p-0 sm:rounded-2xl">
        <div className="grid md:grid-cols-2">
          {/* Left: value proposition */}
          <div className="hidden flex-col justify-between gap-8 bg-secondary/40 p-8 md:flex">
            <div className="flex items-center gap-2.5">
              <img
                src="/icon.png"
                alt=""
                width={36}
                height={36}
                className="size-9 rounded-md"
              />
              <span className="text-sm font-medium tracking-wide">
                focuscube
              </span>
            </div>

            <div className="space-y-3">
              <DialogTitle className="text-xl leading-tight">
                Get the most out of focuscube
              </DialogTitle>
              <DialogDescription className="text-sm leading-relaxed">
                Sign in to sync your settings across devices and keep track
                of your focus history.
              </DialogDescription>
            </div>

            <ul className="space-y-3 text-sm">
              {FEATURES.map((feature) => (
                <li key={feature} className="flex items-start gap-3">
                  <span className="mt-0.5 grid size-5 place-items-center rounded-full bg-foreground/10 text-foreground">
                    <Check className="size-3" />
                  </span>
                  <span className="leading-relaxed">{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Right: providers */}
          <div className="flex flex-col gap-6 p-8">
            <div className="space-y-1.5">
              <DialogTitle className="text-2xl">Sign in</DialogTitle>
              <DialogDescription>
                Choose a provider to continue.
              </DialogDescription>
            </div>

            <div className="flex flex-col gap-3">
              <Button
                asChild
                variant="outline"
                size="lg"
                className="h-12 justify-start gap-3 px-4"
              >
                <a href={oauthStartUrl("google")}>
                  <GoogleIcon />
                  <span>Continue with Google</span>
                </a>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="h-12 justify-start gap-3 px-4"
              >
                <a href={oauthStartUrl("github")}>
                  <GithubIcon />
                  <span>Continue with GitHub</span>
                </a>
              </Button>
            </div>

            <p className="text-xs leading-relaxed text-muted-foreground">
              By continuing, you agree to the{" "}
              <a href="/terms" className="underline-offset-2 hover:underline">
                terms of service
              </a>{" "}
              and{" "}
              <a href="/privacy" className="underline-offset-2 hover:underline">
                privacy policy
              </a>
              .
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function GithubIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="shrink-0 fill-current"
    >
      <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56v-2c-3.2.7-3.87-1.36-3.87-1.36-.52-1.32-1.27-1.67-1.27-1.67-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.02 1.75 2.68 1.24 3.34.95.1-.74.4-1.24.72-1.53-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.18-3.1-.12-.29-.51-1.46.11-3.05 0 0 .96-.31 3.15 1.18a10.94 10.94 0 0 1 5.74 0c2.19-1.49 3.15-1.18 3.15-1.18.62 1.59.23 2.76.11 3.05.74.81 1.18 1.84 1.18 3.1 0 4.42-2.69 5.39-5.25 5.68.41.36.78 1.06.78 2.13v3.16c0 .31.21.68.8.56 4.57-1.52 7.85-5.83 7.85-10.91C23.5 5.65 18.35.5 12 .5Z" />
    </svg>
  )
}

function GoogleIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="shrink-0"
    >
      <path
        fill="#4285F4"
        d="M21.6 12.227c0-.709-.064-1.39-.182-2.045H12v3.868h5.382a4.6 4.6 0 0 1-1.995 3.018v2.51h3.231c1.891-1.741 2.982-4.305 2.982-7.351z"
      />
      <path
        fill="#34A853"
        d="M12 22c2.7 0 4.964-.895 6.618-2.422l-3.231-2.51c-.895.6-2.04.954-3.387.954-2.605 0-4.81-1.76-5.595-4.123H3.064v2.59A9.996 9.996 0 0 0 12 22z"
      />
      <path
        fill="#FBBC05"
        d="M6.405 13.9a6.005 6.005 0 0 1 0-3.8V7.51H3.064a10.005 10.005 0 0 0 0 8.98l3.341-2.59z"
      />
      <path
        fill="#EA4335"
        d="M12 5.977c1.468 0 2.786.505 3.823 1.496l2.868-2.868C16.96 2.99 14.695 2 12 2 8.13 2 4.78 4.218 3.064 7.51l3.341 2.59C7.19 7.736 9.395 5.977 12 5.977z"
      />
    </svg>
  )
}
