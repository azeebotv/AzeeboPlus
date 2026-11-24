import Link from 'next/link';

interface BreadcrumbItem {
  label: string;
  href?: string;
}
interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb" className="az-body text-az-ink-muted mb-4">
      <ol
        className="flex items-center space-x-2"
        itemScope
        itemType="https://schema.org/BreadcrumbList"
      >
        {items.map((item, i) => (
          <li
            key={i}
            className="flex items-center"
            itemScope
            itemProp="itemListElement"
            itemType="https://schema.org/ListItem"
          >
            {i > 0 && (
              <span className="mx-2 text-az-ink-dim" aria-hidden="true">
                /
              </span>
            )}
            {item.href ? (
              <Link
                href={item.href}
                className="hover:text-az-flame focus:outline-none focus:ring-2 focus:ring-az-flame rounded"
                itemProp="item"
              >
                <span itemProp="name">{item.label}</span>
              </Link>
            ) : (
              <span className="text-az-ink font-medium" itemProp="name">
                {item.label}
              </span>
            )}
            <meta itemProp="position" content={String(i + 1)} />
          </li>
        ))}
      </ol>
    </nav>
  );
}
