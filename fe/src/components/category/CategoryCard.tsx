import type {Category} from "../../types/category";
import {Link} from "react-router-dom";
import {Layers, Tag} from "lucide-react";

export function CategoryCard({cat}: { cat: Category }) {
    return (
        <Link
            to={`/courses/${cat.slug}`}
            className="group relative bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition overflow-hidden"
        >
            <div className="p-5">
                <div className="flex items-center gap-4">
                    <div
                        className="shrink-0 grid place-items-center size-14 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 text-blue-600 group-hover:from-blue-100 group-hover:to-indigo-100">
                        <Layers className="size-6"/>
                    </div>
                    <div className="min-w-0">
                        <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-700 truncate">{cat.name}</h3>
                        {cat.description && (
                            <p className="text-sm text-gray-500 line-clamp-2 mt-0.5">{cat.description}</p>
                        )}
                        <div
                            className="mt-2 text-xs text-blue-700 inline-flex items-center gap-1 bg-blue-50 px-2 py-0.5 rounded-full">
                            <Tag className="size-3"/> Danh mục
                        </div>
                    </div>
                </div>
            </div>
            <div
                className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-blue-600/70 via-indigo-600/70 to-blue-600/70 opacity-0 group-hover:opacity-100 transition"/>
        </Link>
    );
}