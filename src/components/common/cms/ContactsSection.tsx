'use client';

import { contactsActions } from '@/app/actions/cms/sections/contactsActions';
import { i18nActions } from '@/app/actions/cms/sections/i18nActions';
import { useLayoutStore } from '@/store/layoutStore';
import type { Contact } from '@/types/fetchedData.types';
import type { LucideProps } from 'lucide-react';
import {
  Edit3,
  Plus,
  Save,
  Trash2,
  X,
  Eye,
  ArrowUp,
  ArrowDown,
  Globe,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import type React from 'react';
import { Suspense, useEffect, useState } from 'react';
import { ErrorDiv } from '../ErrorDiv';
import { PreviewModal } from './PreviewModal';
import { ContactsPreview } from './previews/ContactsPreview';

type ContactWithEditing = Contact & {
  isEditing: boolean;
};

type EditableContact = ContactWithEditing;

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
      <div className="flex items-center justify-center w-6 h-6 bg-red-500/20 rounded-sm text-red-500 text-xs">
        ?
      </div>
    );
  }

  if (!Icon) {
    return (
      <div className="flex items-center justify-center w-6 h-6 bg-gray-500/20 rounded-sm text-gray-500 text-xs">
        ...
      </div>
    );
  }

  return <Icon size={size} className={className} />;
}

export default function ContactsSection() {
  const { heroSection } = useLayoutStore();
  const [contacts, setContacts] = useState<EditableContact[]>([]);
  const [originalContacts, setOriginalContacts] = useState<EditableContact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newContact, setNewContact] = useState({
    label: '',
    icon: '',
    link: '',
    bg_color: '#3B82F6',
  });

  // Track modifications
  const [modifiedContacts, setModifiedContacts] = useState<Set<number>>(new Set());
  const [newContacts, setNewContacts] = useState<EditableContact[]>([]);
  const [deletedContacts, setDeletedContacts] = useState<Set<number>>(new Set());
  const [orderChanged, setOrderChanged] = useState(false);

  // Translation state
  const [translations, setTranslations] = useState<{
    en: { title: string; subtitle: string };
    it: { title: string; subtitle: string };
  }>({
    en: { title: '', subtitle: '' },
    it: { title: '', subtitle: '' },
  });
  const [originalTranslations, setOriginalTranslations] = useState(translations);
  const [translationLocale, setTranslationLocale] = useState<'en' | 'it'>('en');
  const [isTranslationsExpanded, setIsTranslationsExpanded] = useState(false);
  const [isLoadingTranslations, setIsLoadingTranslations] = useState(true);

  useEffect(() => {
    fetchContacts();
    fetchTranslations();
  }, []);

  const fetchTranslations = async () => {
    setIsLoadingTranslations(true);
    try {
      const result = await i18nActions({ type: 'GET' });
      if (result.success && result.data) {
        const i18nData = result.data as Array<{
          language: string;
          translations: Record<string, unknown>;
        }>;
        
        const enData = i18nData.find((d) => d.language === 'en');
        const itData = i18nData.find((d) => d.language === 'it');
        
        const contactsEn = (enData?.translations?.['contacts-section'] as {
          title?: string;
          subtitle?: string;
        }) || {};
        
        const contactsIt = (itData?.translations?.['contacts-section'] as {
          title?: string;
          subtitle?: string;
        }) || {};
        
        const newTranslations = {
          en: {
            title: contactsEn.title || '',
            subtitle: contactsEn.subtitle || '',
          },
          it: {
            title: contactsIt.title || '',
            subtitle: contactsIt.subtitle || '',
          },
        };
        
        setTranslations(newTranslations);
        setOriginalTranslations(JSON.parse(JSON.stringify(newTranslations)));
      }
    } catch (error) {
      console.error('Error fetching translations:', error);
    } finally {
      setIsLoadingTranslations(false);
    }
  };

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
      setOriginalContacts(JSON.parse(JSON.stringify(contactsWithEditing))); // Deep copy
    } catch (error) {
      console.error('Error fetching contacts:', error);
      setError(
        error instanceof Error ? error.message : 'Failed to fetch contacts'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (
    contactId: number,
    field: keyof Contact,
    value: string
  ) => {
    setContacts((prev) =>
      prev.map((contact) =>
        contact.id === contactId ? { ...contact, [field]: value } : contact
      )
    );
    // Track modification (only for existing contacts, not new ones)
    if (contactId > 0) {
      setModifiedContacts((prev) => new Set(prev).add(contactId));
    }
  };

  const handleCreateContact = () => {
    if (!newContact.label || !newContact.icon || !newContact.link) {
      setError('Please fill in all required fields');
      return;
    }

    // Generate temporary ID (negative to avoid conflicts)
    const tempId = -Date.now();
    const newContactEntry: EditableContact = {
      id: tempId,
      label: newContact.label,
      icon: newContact.icon,
      link: newContact.link,
      bg_color: newContact.bg_color,
      position: contacts.length + newContacts.length,
      isEditing: false,
    };

    // Add to local state
    setContacts((prev) => [...prev, newContactEntry]);
    setNewContacts((prev) => [...prev, newContactEntry]);

    // Reset form
    setNewContact({
      label: '',
      icon: '',
      link: '',
      bg_color: '#3B82F6',
    });
    setIsCreating(false);
  };

  const handleUpdateContact = (id: number, updatedData: Partial<Contact>) => {
    setContacts((prev) =>
      prev.map((contact) =>
        contact.id === id
          ? { ...contact, ...updatedData, isEditing: false }
          : contact
      )
    );
    // Track modification
    if (id > 0) {
      setModifiedContacts((prev) => new Set(prev).add(id));
    }
  };

  const handleDeleteContact = (id: number) => {
    // Check if it's a new contact
    const isNewContact = newContacts.some((nc) => nc.id === id);
    
    if (isNewContact) {
      // Remove from new contacts
      setNewContacts((prev) => prev.filter((c) => c.id !== id));
    } else {
      // Track for deletion
      setDeletedContacts((prev) => new Set(prev).add(id));
    }

    // Remove from modified contacts if present
    setModifiedContacts((prev) => {
      const newSet = new Set(prev);
      newSet.delete(id);
      return newSet;
    });

    // Remove from local state
    setContacts((prev) => prev.filter((contact) => contact.id !== id));
  };

  const moveContactUp = (contactId: number) => {
    const currentIndex = contacts.findIndex((c) => c.id === contactId);
    if (currentIndex <= 0) return; // Already at top

    const newContacts = [...contacts];
    [newContacts[currentIndex - 1], newContacts[currentIndex]] = [
      newContacts[currentIndex],
      newContacts[currentIndex - 1],
    ];
    setContacts(newContacts);
    setOrderChanged(true);
  };

  const moveContactDown = (contactId: number) => {
    const currentIndex = contacts.findIndex((c) => c.id === contactId);
    if (currentIndex < 0 || currentIndex >= contacts.length - 1) return; // Already at bottom

    const newContacts = [...contacts];
    [newContacts[currentIndex], newContacts[currentIndex + 1]] = [
      newContacts[currentIndex + 1],
      newContacts[currentIndex],
    ];
    setContacts(newContacts);
    setOrderChanged(true);
  };

  const handleTranslationChange = (
    locale: 'en' | 'it',
    field: 'title' | 'subtitle',
    value: string
  ) => {
    setTranslations((prev) => ({
      ...prev,
      [locale]: { ...prev[locale], [field]: value },
    }));
  };

  const hasTranslationChanges = () => {
    return JSON.stringify(translations) !== JSON.stringify(originalTranslations);
  };

  const applyAllChanges = async () => {
    try {
      setIsUpdating(true);
      setError(null);

      // 1. Delete contacts
      for (const contactId of deletedContacts) {
        const result = await contactsActions({
          type: 'DELETE',
          id: contactId,
        });

        if (!result.success) {
          throw new Error(result.error || `Failed to delete contact ${contactId}`);
        }
      }

      // 2. Create new contacts
      for (const newContact of newContacts) {
        const position = contacts.findIndex((c) => c.id === newContact.id);
        
        const result = await contactsActions({
          type: 'CREATE',
          data: {
            label: newContact.label,
            icon: newContact.icon,
            link: newContact.link,
            bg_color: newContact.bg_color,
            position: position >= 0 ? position : contacts.length,
          },
        });

        if (!result.success) {
          throw new Error(result.error || `Failed to create contact ${newContact.label}`);
        }
      }

      // 3. Update contact order if changed
      if (orderChanged) {
        const positionUpdates = contacts.map((contact, index) => ({
          id: contact.id,
          position: index,
        }));

        // Only update positions for existing contacts (not new ones)
        const existingUpdates = positionUpdates.filter(
          (update) => update.id > 0 && !newContacts.some((nc) => nc.id === update.id)
        );

        if (existingUpdates.length > 0) {
          const result = await contactsActions({
            type: 'REORDER',
            contacts: existingUpdates,
          });

          if (!result.success) {
            throw new Error(result.error || 'Failed to reorder contacts');
          }
        }
      }

      // 4. Update modified contacts
      for (const contactId of modifiedContacts) {
        const contact = contacts.find((c) => c.id === contactId);
        if (!contact) continue;

        const result = await contactsActions({
          type: 'UPDATE',
          id: contactId,
          data: {
            label: contact.label,
            icon: contact.icon,
            link: contact.link,
            bg_color: contact.bg_color,
            position: contact.position,
          },
        });

        if (!result.success) {
          throw new Error(result.error || `Failed to update contact ${contactId}`);
        }
      }

      // Save translations if changed
      if (hasTranslationChanges()) {
        // Update English translations
        const enResult = await i18nActions({
          type: 'UPDATE_SECTION',
          locale: 'en',
          sectionKey: 'contacts-section',
          sectionData: translations.en,
        });
        if (!enResult.success) {
          throw new Error(enResult.error || 'Failed to update English translations');
        }

        // Update Italian translations
        const itResult = await i18nActions({
          type: 'UPDATE_SECTION',
          locale: 'it',
          sectionKey: 'contacts-section',
          sectionData: translations.it,
        });
        if (!itResult.success) {
          throw new Error(itResult.error || 'Failed to update Italian translations');
        }

        setOriginalTranslations(JSON.parse(JSON.stringify(translations)));
      }

      // Refresh data
      await fetchContacts();
      
      // Reset tracking
      setModifiedContacts(new Set());
      setNewContacts([]);
      setDeletedContacts(new Set());
      setOrderChanged(false);
    } catch (error) {
      console.error('Error applying changes:', error);
      setError(
        error instanceof Error ? error.message : 'Failed to apply changes'
      );
    } finally {
      setIsUpdating(false);
    }
  };

  const cancelAllChanges = () => {
    // Revert to original data
    setContacts(JSON.parse(JSON.stringify(originalContacts)));
    setTranslations(JSON.parse(JSON.stringify(originalTranslations)));
    
    // Reset tracking
    setModifiedContacts(new Set());
    setNewContacts([]);
    setDeletedContacts(new Set());
    setOrderChanged(false);
    
    // Reset form
    setNewContact({
      label: '',
      icon: '',
      link: '',
      bg_color: '#3B82F6',
    });
    setIsCreating(false);
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

  const hasChanges =
    modifiedContacts.size > 0 ||
    newContacts.length > 0 ||
    deletedContacts.size > 0 ||
    orderChanged ||
    hasTranslationChanges();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-main" />
      </div>
    );
  }

  return (
    <div className="md:mt-8 mb-8 md:mb-0 lg:mt-8">
      {error && (
        <div className="mb-6 text-red-500 bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
          {error}
        </div>
      )}

      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="hidden lg:block text-4xl font-bold text-main mb-4">
          Contacts Section
        </h1>
        <p className="text-lighttext2 text-lg mb-4">
          Manage your contact links and social media profiles
        </p>
        <div className="flex justify-center gap-3 mt-4">
          <button
            type="button"
            className="flex items-center gap-2 px-6 py-3 bg-darkgray hover:bg-darkergray text-lighttext font-medium rounded-lg transition-all duration-200 border border-lighttext2/20"
            onClick={() => setIsPreviewOpen(true)}
          >
            <Eye className="w-4 h-4" />
            Preview
          </button>
          <button
            type="button"
            className="flex items-center gap-2 px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!hasChanges || isUpdating}
            onClick={cancelAllChanges}
          >
            <X className="w-4 h-4" />
            Cancel
          </button>
          <button
            type="button"
            className="flex items-center gap-2 px-6 py-3 bg-main hover:bg-secondary text-white font-medium rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!hasChanges || isUpdating}
            onClick={applyAllChanges}
          >
            {isUpdating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                Applying...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Apply Changes
              </>
            )}
          </button>
        </div>
      </div>

      {/* Translations Section */}
      <div className="bg-darkergray rounded-xl p-6 mb-6">
        <button
          type="button"
          onClick={() => setIsTranslationsExpanded(!isTranslationsExpanded)}
          className="w-full flex items-center justify-between text-left"
        >
          <h2 className="text-xl font-bold text-main mb-4 flex items-center gap-2">
            <Globe className="w-5 h-5" />
            Translations
          </h2>
          {isTranslationsExpanded ? (
            <ChevronUp className="w-5 h-5 text-lighttext2" />
          ) : (
            <ChevronDown className="w-5 h-5 text-lighttext2" />
          )}
        </button>

        {isTranslationsExpanded && (
          <div className="space-y-6 mt-4">
            {/* Locale Tabs */}
            <div className="flex gap-2 border-b border-darkgray">
              <button
                type="button"
                onClick={() => setTranslationLocale('en')}
                className={`px-4 py-2 font-medium transition-colors ${
                  translationLocale === 'en'
                    ? 'text-main border-b-2 border-main'
                    : 'text-lighttext2 hover:text-lighttext'
                }`}
              >
                English
              </button>
              <button
                type="button"
                onClick={() => setTranslationLocale('it')}
                className={`px-4 py-2 font-medium transition-colors ${
                  translationLocale === 'it'
                    ? 'text-main border-b-2 border-main'
                    : 'text-lighttext2 hover:text-lighttext'
                }`}
              >
                Italian
              </button>
            </div>

            {isLoadingTranslations ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-main" />
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-lighttext mb-2">
                    Title
                  </label>
                  <input
                    type="text"
                    value={translations[translationLocale].title}
                    onChange={(e) =>
                      handleTranslationChange(translationLocale, 'title', e.target.value)
                    }
                    className="w-full px-3 py-2 bg-darkestgray border border-lighttext2 rounded-lg text-lighttext focus:border-main focus:outline-hidden"
                    placeholder="e.g., Contacts"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-lighttext mb-2">
                    Subtitle
                  </label>
                  <textarea
                    value={translations[translationLocale].subtitle}
                    onChange={(e) =>
                      handleTranslationChange(translationLocale, 'subtitle', e.target.value)
                    }
                    rows={3}
                    className="w-full px-3 py-2 bg-darkestgray border border-lighttext2 rounded-lg text-lighttext focus:border-main focus:outline-hidden resize-y"
                    placeholder="e.g., You can ****reach out**** to me through the following channels:"
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create New Contact */}
      <div className="bg-darkergray rounded-xl p-6 mb-6">
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
              className="w-full px-3 py-2 bg-darkestgray border border-lighttext2 rounded-lg text-lighttext focus:border-main focus:outline-hidden"
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
                className="flex-1 px-3 py-2 bg-darkestgray border border-lighttext2 rounded-lg text-lighttext focus:border-main focus:outline-hidden"
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
              className="w-full px-3 py-2 bg-darkestgray border border-lighttext2 rounded-lg text-lighttext focus:border-main focus:outline-hidden"
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
                    onMoveUp={() => moveContactUp(contact.id)}
                    onMoveDown={() => moveContactDown(contact.id)}
                    isFirst={index === 0}
                    isLast={index === contacts.length - 1}
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <PreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        title="Contacts Section Preview"
      >
        <ContactsPreview
          contacts={contacts.filter((c) => !deletedContacts.has(c.id))}
          resumeData={
            heroSection
              ? {
                  resume_en: heroSection.resume_en || '',
                  resume_it: heroSection.resume_it || '',
                }
              : undefined
          }
        />
      </PreviewModal>
    </div>
  );
}

function ContactDisplay({
  contact,
  onEdit,
  onDelete,
  index,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
}: {
  contact: ContactWithEditing;
  onEdit: () => void;
  onDelete: () => void;
  index: number;
  onMoveUp: () => void;
  onMoveDown: () => void;
  isFirst: boolean;
  isLast: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="flex flex-col gap-1">
            <button
              type="button"
              onClick={onMoveUp}
              disabled={isFirst}
              className="p-1 text-lighttext2 hover:text-main transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              title="Move up"
            >
              <ArrowUp className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onMoveDown}
              disabled={isLast}
              className="p-1 text-lighttext2 hover:text-main transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              title="Move down"
            >
              <ArrowDown className="w-4 h-4" />
            </button>
          </div>
          <span className="text-sm text-lighttext2">#{index + 1}</span>
        </div>

        <div className="flex items-center gap-3">
          <div
            className="w-4 h-4 rounded-sm"
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
            className="w-full px-3 py-2 bg-darkergray border border-lighttext2 rounded-lg text-lighttext focus:border-main focus:outline-hidden"
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
              className="flex-1 px-3 py-2 bg-darkergray border border-lighttext2 rounded-lg text-lighttext focus:border-main focus:outline-hidden"
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
            className="w-full px-3 py-2 bg-darkergray border border-lighttext2 rounded-lg text-lighttext focus:border-main focus:outline-hidden"
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
          Done
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
