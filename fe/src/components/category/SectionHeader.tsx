import {Link} from "react-router-dom";
import {ChevronRight} from "lucide-react";

export function SectionHeader({icon, title, subtitle, to}: {
    icon?: React.ReactNode;
    title: string;
    subtitle?: string;
    to?: string
}) {
    return (
        <div className="flex items-end justify-between mb-6">
            <div className="flex items-center gap-3">
                <div className="w-1.5 h-7 bg-blue-600 rounded"/>
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">{icon} {title}</h2>
                    {subtitle && <p className="text-sm text-gray-600 mt-0.5">{subtitle}</p>}
                </div>
            </div>
            {!!to && (
                <Link to={to}
                      className="hidden sm:inline-flex items-center text-blue-600 hover:text-blue-700 text-sm font-medium">
                    Xem tất cả <ChevronRight className="size-4 ml-1"/>
                </Link>
            )}
        </div>
    );
}
