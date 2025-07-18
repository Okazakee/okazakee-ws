'use client';

import { contactsActions } from '@/app/actions/cms/sections/contactsActions';
import type { Contact } from '@/types/fetchedData.types';
import type { LucideProps } from 'lucide-react';
import {
  Edit3,
  Eye,
  EyeOff,
  GripVertical,
  Plus,
  Save,
  Trash2,
  X,
} from 'lucide-react';
import type React from 'react';
import { Suspense, useEffect, useState } from 'react';
import { ErrorDiv } from '../ErrorDiv';

type ContactWithEditing = Contact & {
  isEditing: boolean;
};

// Icon component with error handling
function IconComponent({
  iconName,
  size = 24,
  className = '',
}: {
  iconName: string;
  size?: number;
  className?: string;
}) {
  const [Icon, setIcon] = useState<React.ComponentType<LucideProps> | null>(
    null
  );
  const [error, setError] = useState(false);

  useEffect(() => {
    const loadIcon = async () => {
      try {
        const module = await import('lucide-react');
        // Use bracket notation with proper typing
        const iconKey = (iconName.charAt(0).toUpperCase() +
          iconName.slice(1)) as keyof typeof module;
        const IconComponent = module[iconKey] as
          | React.ComponentType<LucideProps>
          | undefined;

        if (!IconComponent) {
          throw new Error(`Icon "${iconName}" not found`);
        }

        setIcon(() => IconComponent);
      } catch (err) {
        console.error(`Failed to load icon: ${iconName}`, err);
        setError(true);
      }
    };

    if (iconName) {
      loadIcon();
    }
  }, [iconName]);

  if (error) {
    return (
      <div className="flex items-center justify-center w-6 h-6 bg-red-500/20 rounded text-red-500 text-xs">
        ?
      </div>
    );
  }

  if (!Icon) {
    return (
      <div className="flex items-center justify-center w-6 h-6 bg-gray-500/20 rounded text-gray-500 text-xs">
        ...
      </div>
    );
  }

  return <Icon size={size} className={className} />;
}

export default function ContactsSection() {
  const [contacts, setContacts] = useState<ContactWithEditing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newContact, setNewContact] = useState({
    label: '',
    icon: '',
    link: '',
    bg_color: '#3B82F6',
  });

  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await contactsActions({ type: 'GET' });
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch contacts');
      }

      const contactsWithEditing = (result.data as Contact[]).map(
        (contact: Contact) => ({
          ...contact,
          isEditing: false,
        })
      );

      setContacts(contactsWithEditing);
    } catch (error) {
      console.error('Error fetching contacts:', error);
      setError(
        error instanceof Error ? error.message : 'Failed to fetch contacts'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateContact = async () => {
    if (!newContact.label || !newContact.icon || !newContact.link) {
      setError('Please fill in all required fields');
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      const result = await contactsActions({
        type: 'CREATE',
        data: {
          ...newContact,
          position: contacts.length,
        },
      });

      if (!result.success) {
        throw new Error(result.error || 'Failed to create contact');
      }

      // Reset form and refresh contacts
      setNewContact({
        label: '',
        icon: '',
        link: '',
        bg_color: '#3B82F6',
      });
      setIsCreating(false);
      await fetchContacts();
    } catch (error) {
      console.error('Error creating contact:', error);
      setError(
        error instanceof Error ? error.message : 'Failed to create contact'
      );
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdateContact = async (
    id: number,
    updatedData: Partial<Contact>
  ) => {
    setError(null);

    try {
      const result = await contactsActions({
        type: 'UPDATE',
        id,
        data: updatedData,
      });

      if (!result.success) {
        throw new Error(result.error || 'Failed to update contact');
      }

      // Update local state
      setContacts((prev) =>
        prev.map((contact) =>
          contact.id === id
            ? { ...contact, ...updatedData, isEditing: false }
            : contact
        )
      );
    } catch (error) {
      console.error('Error updating contact:', error);
      setError(
        error instanceof Error ? error.message : 'Failed to update contact'
      );
    }
  };

  const handleDeleteContact = async (id: number) => {
    if (!confirm('Are you sure you want to delete this contact?')) {
      return;
    }

    setError(null);

    try {
      const result = await contactsActions({
        type: 'DELETE',
        id,
      });

      if (!result.success) {
        throw new Error(result.error || 'Failed to delete contact');
      }

      // Remove from local state
      setContacts((prev) => prev.filter((contact) => contact.id !== id));
    } catch (error) {
      console.error('Error deleting contact:', error);
      setError(
        error instanceof Error ? error.message : 'Failed to delete contact'
      );
    }
  };

  const handleReorderContacts = async (
    reorderedContacts: ContactWithEditing[]
  ) => {
    setError(null);

    try {
      const positionUpdates = reorderedContacts.map((contact, index) => ({
        id: contact.id,
        position: index,
      }));

      const result = await contactsActions({
        type: 'REORDER',
        contacts: positionUpdates,
      });

      if (!result.success) {
        throw new Error(result.error || 'Failed to reorder contacts');
      }

      // Update local state with new positions
      setContacts(
        reorderedContacts.map((contact, index) => ({
          ...contact,
          position: index,
        }))
      );
    } catch (error) {
      console.error('Error reordering contacts:', error);
      setError(
        error instanceof Error ? error.message : 'Failed to reorder contacts'
      );
    }
  };

  const toggleEditing = (id: number) => {
    setContacts((prev) =>
      prev.map((contact) =>
        contact.id === id
          ? { ...contact, isEditing: !contact.isEditing }
          : contact
      )
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-main" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-main mb-4">
          Contacts Section Editor
        </h1>
        <p className="text-lighttext2 text-lg">
          Manage your contact links and social media profiles
        </p>
      </div>

      {/* Create New Contact */}
      <div className="bg-darkergray rounded-xl p-6">
        <h2 className="text-2xl font-bold text-main mb-4">Add New Contact</h2>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label
              htmlFor="contact-label"
              className="block text-sm font-medium text-lighttext mb-2"
            >
              Label *
            </label>
            <input
              id="contact-label"
              type="text"
              value={newContact.label}
              onChange={(e) =>
                setNewContact((prev) => ({ ...prev, label: e.target.value }))
              }
              className="w-full px-3 py-2 bg-darkestgray border border-lighttext2 rounded-lg text-lighttext focus:border-main focus:outline-none"
              placeholder="e.g., LinkedIn"
            />
          </div>

          <div>
            <label
              htmlFor="contact-icon"
              className="block text-sm font-medium text-lighttext mb-2"
            >
              Icon Name *
            </label>
            <div className="flex gap-2">
              <input
                id="contact-icon"
                type="text"
                value={newContact.icon}
                onChange={(e) =>
                  setNewContact((prev) => ({ ...prev, icon: e.target.value }))
                }
                className="flex-1 px-3 py-2 bg-darkestgray border border-lighttext2 rounded-lg text-lighttext focus:border-main focus:outline-none"
                placeholder="e.g., linkedin"
              />
              {newContact.icon && (
                <div className="flex items-center justify-center w-10 h-10 bg-darkestgray border border-lighttext2 rounded-lg">
                  <IconComponent
                    iconName={newContact.icon}
                    size={20}
                    className="text-lighttext"
                  />
                </div>
              )}
            </div>
          </div>

          <div>
            <label
              htmlFor="contact-link"
              className="block text-sm font-medium text-lighttext mb-2"
            >
              Link *
            </label>
            <input
              id="contact-link"
              type="url"
              value={newContact.link}
              onChange={(e) =>
                setNewContact((prev) => ({ ...prev, link: e.target.value }))
              }
              className="w-full px-3 py-2 bg-darkestgray border border-lighttext2 rounded-lg text-lighttext focus:border-main focus:outline-none"
              placeholder="https://linkedin.com/in/..."
            />
          </div>

          <div>
            <label
              htmlFor="contact-bg-color"
              className="block text-sm font-medium text-lighttext mb-2"
            >
              Background Color
            </label>
            <input
              id="contact-bg-color"
              type="color"
              value={newContact.bg_color}
              onChange={(e) =>
                setNewContact((prev) => ({ ...prev, bg_color: e.target.value }))
              }
              className="w-full h-10 bg-darkestgray border border-lighttext2 rounded-lg cursor-pointer"
            />
          </div>
        </div>

        <div className="mt-4">
          <button
            type="button"
            onClick={handleCreateContact}
            disabled={
              isCreating ||
              !newContact.label ||
              !newContact.icon ||
              !newContact.link
            }
            className="flex items-center gap-2 px-4 py-2 bg-main hover:bg-secondary text-white font-medium rounded-lg transition-all duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            <Plus className="w-4 h-4" />
            {isCreating ? 'Creating...' : 'Add Contact'}
          </button>
        </div>
      </div>

      {/* Existing Contacts */}
      <div className="bg-darkergray rounded-xl p-6">
        <h2 className="text-2xl font-bold text-main mb-4">Manage Contacts</h2>

        {contacts.length === 0 ? (
          <div className="text-center py-8 text-lighttext2">
            No contacts found. Add your first contact above.
          </div>
        ) : (
          <div className="space-y-4">
            {contacts.map((contact, index) => (
              <div
                key={contact.id}
                className="bg-darkestgray rounded-lg p-4 border border-lighttext2"
              >
                {contact.isEditing ? (
                  <EditContactForm
                    contact={contact}
                    onSave={(updatedData) =>
                      handleUpdateContact(contact.id, updatedData)
                    }
                    onCancel={() => toggleEditing(contact.id)}
                  />
                ) : (
                  <ContactDisplay
                    contact={contact}
                    onEdit={() => toggleEditing(contact.id)}
                    onDelete={() => handleDeleteContact(contact.id)}
                    index={index}
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {error && (
        <div className="mt-6 text-red-500 bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
          {error}
        </div>
      )}
    </div>
  );
}

function ContactDisplay({
  contact,
  onEdit,
  onDelete,
  index,
}: {
  contact: ContactWithEditing;
  onEdit: () => void;
  onDelete: () => void;
  index: number;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-lighttext2">
          <GripVertical className="w-4 h-4" />
          <span className="text-sm">#{index + 1}</span>
        </div>

        <div className="flex items-center gap-3">
          <div
            className="w-4 h-4 rounded"
            style={{ backgroundColor: contact.bg_color }}
          />
          <div className="flex items-center gap-2">
            <IconComponent
              iconName={contact.icon}
              size={20}
              className="text-lighttext"
            />
            <span className="font-medium text-lighttext">{contact.label}</span>
          </div>
          <span className="text-lighttext2">({contact.icon})</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onEdit}
          className="p-2 text-lighttext2 hover:text-main transition-colors"
        >
          <Edit3 className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="p-2 text-lighttext2 hover:text-red-500 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function EditContactForm({
  contact,
  onSave,
  onCancel,
}: {
  contact: ContactWithEditing;
  onSave: (data: Partial<Contact>) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    label: contact.label,
    icon: contact.icon,
    link: contact.link,
    bg_color: contact.bg_color,
  });

  const handleSave = () => {
    onSave(formData);
  };

  return (
    <div className="space-y-4">
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label
            htmlFor="edit-contact-label"
            className="block text-sm font-medium text-lighttext mb-2"
          >
            Label
          </label>
          <input
            id="edit-contact-label"
            type="text"
            value={formData.label}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, label: e.target.value }))
            }
            className="w-full px-3 py-2 bg-darkergray border border-lighttext2 rounded-lg text-lighttext focus:border-main focus:outline-none"
          />
        </div>

        <div>
          <label
            htmlFor="edit-contact-icon"
            className="block text-sm font-medium text-lighttext mb-2"
          >
            Icon Name
          </label>
          <div className="flex gap-2">
            <input
              id="edit-contact-icon"
              type="text"
              value={formData.icon}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, icon: e.target.value }))
              }
              className="flex-1 px-3 py-2 bg-darkergray border border-lighttext2 rounded-lg text-lighttext focus:border-main focus:outline-none"
            />
            {formData.icon && (
              <div className="flex items-center justify-center w-10 h-10 bg-darkergray border border-lighttext2 rounded-lg">
                <IconComponent
                  iconName={formData.icon}
                  size={20}
                  className="text-lighttext"
                />
              </div>
            )}
          </div>
        </div>

        <div>
          <label
            htmlFor="edit-contact-link"
            className="block text-sm font-medium text-lighttext mb-2"
          >
            Link
          </label>
          <input
            id="edit-contact-link"
            type="url"
            value={formData.link}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, link: e.target.value }))
            }
            className="w-full px-3 py-2 bg-darkergray border border-lighttext2 rounded-lg text-lighttext focus:border-main focus:outline-none"
          />
        </div>

        <div>
          <label
            htmlFor="edit-contact-bg-color"
            className="block text-sm font-medium text-lighttext mb-2"
          >
            Background Color
          </label>
          <input
            id="edit-contact-bg-color"
            type="color"
            value={formData.bg_color}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, bg_color: e.target.value }))
            }
            className="w-full h-10 bg-darkergray border border-lighttext2 rounded-lg cursor-pointer"
          />
        </div>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleSave}
          className="flex items-center gap-2 px-3 py-2 bg-main hover:bg-secondary text-white font-medium rounded-lg transition-all duration-200"
        >
          <Save className="w-4 h-4" />
          Save
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex items-center gap-2 px-3 py-2 bg-darkestgray hover:bg-darkgray text-lighttext font-medium rounded-lg transition-all duration-200"
        >
          <X className="w-4 h-4" />
          Cancel
        </button>
      </div>
    </div>
  );
}
