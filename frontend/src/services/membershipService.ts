
import { Membership, MembershipTemplate } from '@/types';


export const getActiveMembership = async (userId: string): Promise<Membership | null> => {
  try {
    const response = await fetch(`/api/users/${userId}/active-membership`);
    if (!response.ok) {
      // If no active membership is found, the API returns 404
      if (response.status === 404) {
        return null;
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching active membership:', error);
    return null;
  }
};

export const checkFeatureUsage = async (userId: string, featureType: string): Promise<{ can_use: boolean; reason?: string }> => {
  try {
    const response = await fetch(`${API_BASE_PATH}/usage/check`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ user_id: userId, feature_type: featureType }),
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error checking feature usage:', error);
    return { can_use: false, reason: 'Network error or API issue' };
  }
};

export const updateFeatureUsage = async (userId: string, featureType: string): Promise<any> => {
  try {
    const response = await fetch(`${API_BASE_PATH}/usage/update`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ user_id: userId, feature_type: featureType }),
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error updating feature usage:', error);
    return null;
  }
};

export const getMembershipTemplates = async (customerType?: string): Promise<MembershipTemplate[]> => {
  try {
    let url = '/api/templates'; // Use the new Next.js API route
    if (customerType) {
      url += `?customer_type=${customerType}`;
    }
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching membership templates:', error);
    return [];
  }
};

export const purchaseMembership = async (userId: string, templateId: string): Promise<Membership | null> => {
  try {
    // Fetch the template to get duration_days
    const templates = await getMembershipTemplates(); // This will now use the proxied route
    const template = templates.find(t => t.id === templateId);

    if (!template) {
      throw new Error('Membership template not found.');
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + template.duration_days);

    // Use the new Next.js API route for memberships
    const response = await fetch('/api/memberships', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: userId,
        template_id: templateId,
        expires_at: expiresAt.toISOString(),
        status: 'ACTIVE',
        name: template.name, // Include name from template
        limits: template.limits, // Include limits from template
        customer_type: template.customer_type, // Include customer_type from template
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error purchasing membership:', error);
    return null;
  }
};
