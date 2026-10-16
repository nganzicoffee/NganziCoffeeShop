export default function AppLogo() {
    return (
        <div className="flex items-center gap-2.5">
            {/* Compact mark shown only when sidebar is collapsed to icon mode */}
            <img
                src="/images/brand/favicon-large.png"
                alt="Nganzi Coffee"
                className="hidden size-7 object-contain group-data-[collapsible=icon]:block"
            />

            {/* Full logo shown when sidebar is expanded */}
            <div className="relative h-9 w-32 overflow-hidden group-data-[collapsible=icon]:hidden">
                <img
                    src="/images/brand/logo.svg"
                    alt="Nganzi Coffee"
                    className="absolute top-1/2 left-0 h-[120px] w-[120px] -translate-y-1/2 object-contain"
                />
            </div>
            <span className="rounded bg-orange/15 px-2 py-0.5 text-[10px] font-bold tracking-wider text-orange uppercase group-data-[collapsible=icon]:hidden">
                Admin
            </span>
        </div>
    );
}
