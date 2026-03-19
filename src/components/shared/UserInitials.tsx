import React from 'react';

interface UserInitialsProps {
  firstName?: string;
  lastName?: string;
  size?: 'sm' | 'md';
}

export const UserInitials: React.FC<UserInitialsProps> = ({
  firstName,
  lastName,
  size = 'sm'
}) => {
  const getInitials = () => {
    const first = firstName?.trim().charAt(0).toUpperCase() || '';
    const last = lastName?.trim().charAt(0).toUpperCase() || '';
    return first + last;
  };

  const getFullName = () => {
    if (firstName && lastName) {
      return `${firstName} ${lastName}`;
    }
    if (firstName) return firstName;
    if (lastName) return lastName;
    return '';
  };

  const initials = getInitials();

  if (!initials) {
    return null;
  }

  const fullName = getFullName();
  const sizeClasses = size === 'sm'
    ? 'w-6 h-6 text-[10px]'
    : 'w-8 h-8 text-xs';

  return (
    <div
      className={`${sizeClasses} rounded-full bg-blue-100 text-blue-700 font-semibold flex items-center justify-center flex-shrink-0`}
      title={fullName}
    >
      {initials}
    </div>
  );
};
