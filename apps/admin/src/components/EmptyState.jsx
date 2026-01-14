import React from 'react';

/**
 * Enterprise Empty State Component
 * Consistent empty state handling across all pages
 */
export default function EmptyState({
  icon = '📭',
  title = 'No data available',
  description = 'There is nothing to display at the moment.',
  action,
  actionLabel = 'Get Started',
  variant = 'default', // 'default' | 'compact' | 'centered'
  children,
}) {
  const variants = {
    default: {
      padding: '3rem 2rem',
      minHeight: '300px',
    },
    compact: {
      padding: '1.5rem',
      minHeight: '150px',
    },
    centered: {
      padding: '4rem 2rem',
      minHeight: '400px',
    },
  };

  const style = variants[variant] || variants.default;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        background: 'linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%)',
        borderRadius: '12px',
        border: '1px dashed #d1d5db',
        ...style,
      }}
      role="status"
      aria-label={title}
    >
      {/* Icon */}
      <div
        style={{
          fontSize: variant === 'compact' ? '2rem' : '3rem',
          marginBottom: '1rem',
          opacity: 0.8,
        }}
      >
        {icon}
      </div>

      {/* Title */}
      <h3
        style={{
          margin: '0 0 0.5rem',
          fontSize: variant === 'compact' ? '1rem' : '1.25rem',
          fontWeight: 600,
          color: '#374151',
        }}
      >
        {title}
      </h3>

      {/* Description */}
      <p
        style={{
          margin: 0,
          fontSize: variant === 'compact' ? '0.875rem' : '1rem',
          color: '#6b7280',
          maxWidth: '400px',
          lineHeight: 1.5,
        }}
      >
        {description}
      </p>

      {/* Custom children */}
      {children}

      {/* Action button */}
      {action && (
        <button
          onClick={action}
          style={{
            marginTop: '1.5rem',
            padding: '0.75rem 1.5rem',
            fontSize: '0.875rem',
            fontWeight: 600,
            color: 'white',
            background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            transition: 'transform 0.2s, box-shadow 0.2s',
            boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = 'translateY(-2px)';
            e.target.style.boxShadow = '0 6px 20px rgba(59, 130, 246, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.3)';
          }}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

// Pre-configured empty states for common scenarios
export function NoResultsState({ searchTerm, onClear }) {
  return (
    <EmptyState
      icon="🔍"
      title="No results found"
      description={
        searchTerm
          ? `No items match "${searchTerm}". Try adjusting your search or filters.`
          : "Try adjusting your filters to find what you are looking for."
      }
      action={onClear}
      actionLabel="Clear Filters"
      variant="compact"
    />
  );
}

export function ErrorState({ message, onRetry }) {
  return (
    <EmptyState
      icon="⚠️"
      title="Something went wrong"
      description={message || 'An unexpected error occurred. Please try again.'}
      action={onRetry}
      actionLabel="Try Again"
    />
  );
}

export function LoadingState({ message = 'Loading...' }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '3rem 2rem',
        minHeight: '300px',
      }}
    >
      <div
        style={{
          width: '48px',
          height: '48px',
          border: '4px solid #e5e7eb',
          borderTopColor: '#3b82f6',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
        }}
      />
      <p style={{ marginTop: '1rem', color: '#6b7280' }}>{message}</p>
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export function NoDataState({ entityName = 'items', onCreate }) {
  return (
    <EmptyState
      icon="📋"
      title={`No ${entityName} yet`}
      description={`Create your first ${entityName.slice(0, -1) || 'item'} to get started.`}
      action={onCreate}
      actionLabel={`Create ${entityName.slice(0, -1) || 'Item'}`}
    />
  );
}

export function NoPermissionState() {
  return (
    <EmptyState
      icon="🔒"
      title="Access Restricted"
      description="You don't have permission to view this content. Contact your administrator for access."
      variant="centered"
    />
  );
}

export function MaintenanceState({ estimatedTime }) {
  return (
    <EmptyState
      icon="🔧"
      title="Under Maintenance"
      description={
        estimatedTime
          ? `We're performing scheduled maintenance. Expected completion: ${estimatedTime}`
          : "We're performing scheduled maintenance. Please check back soon."
      }
      variant="centered"
    />
  );
}
