import { Button } from "@/components/ui/button"
import { LoginModal } from "@/components/LoginModal"

export function Navbar() {
  return (
    <header className="mx-auto flex w-full max-w-3xl items-center justify-between px-6 py-5">
      <a href="/" className="flex items-center gap-2.5" aria-label="focuscube">
        <img
          src="/icon.png"
          alt=""
          width={32}
          height={32}
          className="size-8 rounded-md"
        />
        <span className="text-sm font-medium tracking-wide">focuscube</span>
      </a>

      <div className="flex items-center gap-1">
        <LoginModal
          trigger={
            <Button variant="outline" size="sm" className="ml-1">
              Sign in
            </Button>
          }
          onProvider={(provider) => {
            // OAuth flow will be wired here
            console.log("login:", provider)
          }}
        />
      </div>
    </header>
  )
}
