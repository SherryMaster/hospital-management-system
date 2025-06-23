// Form step components (to be created)
import PersonalInfoStep from '../components/forms/steps/PersonalInfoStep';
import ContactInfoStep from '../components/forms/steps/ContactInfoStep';
import EmergencyContactStep from '../components/forms/steps/EmergencyContactStep';
import MedicalInfoStep from '../components/forms/steps/MedicalInfoStep';
import ReviewStep from '../components/forms/steps/ReviewStep';
import DoctorCredentialsStep from '../components/forms/steps/DoctorCredentialsStep';
import DoctorEmploymentStep from '../components/forms/steps/DoctorEmploymentStep';
import NurseCredentialsStep from '../components/forms/steps/NurseCredentialsStep';
import NurseEmploymentStep from '../components/forms/steps/NurseEmploymentStep';
import AdminDetailsStep from '../components/forms/steps/AdminDetailsStep';
import ReceptionistDetailsStep from '../components/forms/steps/ReceptionistDetailsStep';
import PharmacistDetailsStep from '../components/forms/steps/PharmacistDetailsStep';

// Validation functions
export const validatePersonalInfo = (formData) => {
  const errors = {};
  
  if (!formData.first_name?.trim()) {
    errors.first_name = 'First name is required';
  }
  
  if (!formData.last_name?.trim()) {
    errors.last_name = 'Last name is required';
  }
  
  if (!formData.username?.trim()) {
    errors.username = 'Username is required';
  }
  
  if (!formData.email?.trim()) {
    errors.email = 'Email is required';
  } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
    errors.email = 'Email is invalid';
  }
  
  if (!formData.password?.trim()) {
    errors.password = 'Password is required';
  } else if (formData.password.length < 8) {
    errors.password = 'Password must be at least 8 characters';
  }
  
  if (formData.password !== formData.password_confirm) {
    errors.password_confirm = 'Passwords do not match';
  }
  
  return errors;
};

export const validateContactInfo = (formData) => {
  const errors = {};
  
  if (!formData.phone_number?.trim()) {
    errors.phone_number = 'Phone number is required';
  }
  
  if (!formData.address?.trim()) {
    errors.address = 'Address is required';
  }
  
  if (!formData.city?.trim()) {
    errors.city = 'City is required';
  }
  
  return errors;
};

export const validateEmergencyContact = (formData) => {
  const errors = {};
  
  if (!formData.emergency_contact_name?.trim()) {
    errors.emergency_contact_name = 'Emergency contact name is required';
  }
  
  if (!formData.emergency_contact_phone?.trim()) {
    errors.emergency_contact_phone = 'Emergency contact phone is required';
  }
  
  if (!formData.emergency_contact_relationship?.trim()) {
    errors.emergency_contact_relationship = 'Relationship is required';
  }
  
  return errors;
};

export const validateDoctorCredentials = (formData) => {
  const errors = {};

  if (!formData.license_number?.trim()) {
    errors.license_number = 'Medical license number is required';
  }

  if (!formData.medical_school?.trim()) {
    errors.medical_school = 'Medical school is required';
  }

  if (!formData.graduation_year) {
    errors.graduation_year = 'Graduation year is required';
  }

  return errors;
};

export const validateDoctorEmployment = (formData) => {
  const errors = {};

  if (!formData.department) {
    errors.department = 'Department is required';
  }

  return errors;
};

export const validateNurseCredentials = (formData) => {
  const errors = {};
  
  if (!formData.license_number?.trim()) {
    errors.license_number = 'Nursing license number is required';
  }
  
  if (!formData.nursing_level) {
    errors.nursing_level = 'Nursing level is required';
  }
  
  return errors;
};

export const validateAdminDetails = (formData) => {
  const errors = {};
  
  if (!formData.access_level) {
    errors.access_level = 'Access level is required';
  }
  
  return errors;
};

export const validatePharmacistDetails = (formData) => {
  const errors = {};
  
  if (!formData.pharmacy_license_number?.trim()) {
    errors.pharmacy_license_number = 'Pharmacy license number is required';
  }
  
  return errors;
};

// Step validation router
export const validateStep = (stepIndex, formData, userType) => {
  const config = USER_FORM_CONFIGS[userType];
  if (!config || !config.steps[stepIndex]) {
    return {};
  }
  
  const step = config.steps[stepIndex];
  if (step.validate) {
    return step.validate(formData);
  }
  
  return {};
};

// User form configurations
export const USER_FORM_CONFIGS = {
  patient: {
    title: 'Create Patient Account',
    submitButtonText: 'Create Patient',
    steps: [
      {
        label: 'Personal Information',
        subtitle: 'Basic personal details and account credentials',
        component: PersonalInfoStep,
        validate: validatePersonalInfo,
      },
      {
        label: 'Contact & Address',
        subtitle: 'Contact information and address details',
        component: ContactInfoStep,
        validate: validateContactInfo,
      },
      {
        label: 'Emergency Contact',
        subtitle: 'Emergency contact information',
        component: EmergencyContactStep,
        validate: validateEmergencyContact,
      },
      {
        label: 'Medical Information',
        subtitle: 'Medical history and health information',
        component: MedicalInfoStep,
      },
      {
        label: 'Review & Confirm',
        subtitle: 'Review all information before creating the account',
        component: ReviewStep,
      },
    ],
  },
  
  doctor: {
    title: 'Create Doctor Account',
    submitButtonText: 'Create Doctor',
    steps: [
      {
        label: 'Personal Information',
        subtitle: 'Basic personal details and account credentials',
        component: PersonalInfoStep,
        validate: validatePersonalInfo,
      },
      {
        label: 'Contact & Address',
        subtitle: 'Contact information and address details',
        component: ContactInfoStep,
        validate: validateContactInfo,
      },
      {
        label: 'Medical Credentials',
        subtitle: 'Medical license and educational background',
        component: DoctorCredentialsStep,
        validate: validateDoctorCredentials,
      },
      {
        label: 'Employment Details',
        subtitle: 'Department, specializations, and employment information',
        component: DoctorEmploymentStep,
        validate: validateDoctorEmployment,
      },
      {
        label: 'Review & Confirm',
        subtitle: 'Review all information before creating the account',
        component: ReviewStep,
      },
    ],
  },
  
  nurse: {
    title: 'Create Nurse Account',
    submitButtonText: 'Create Nurse',
    steps: [
      {
        label: 'Personal Information',
        subtitle: 'Basic personal details and account credentials',
        component: PersonalInfoStep,
        validate: validatePersonalInfo,
      },
      {
        label: 'Contact & Address',
        subtitle: 'Contact information and address details',
        component: ContactInfoStep,
        validate: validateContactInfo,
      },
      {
        label: 'Nursing Credentials',
        subtitle: 'Nursing license and educational background',
        component: NurseCredentialsStep,
        validate: validateNurseCredentials,
      },
      {
        label: 'Employment Details',
        subtitle: 'Department, unit, and employment information',
        component: NurseEmploymentStep,
      },
      {
        label: 'Review & Confirm',
        subtitle: 'Review all information before creating the account',
        component: ReviewStep,
      },
    ],
  },
  
  admin: {
    title: 'Create Administrator Account',
    submitButtonText: 'Create Administrator',
    steps: [
      {
        label: 'Personal Information',
        subtitle: 'Basic personal details and account credentials',
        component: PersonalInfoStep,
        validate: validatePersonalInfo,
      },
      {
        label: 'Contact & Address',
        subtitle: 'Contact information and address details',
        component: ContactInfoStep,
        validate: validateContactInfo,
      },
      {
        label: 'Administrator Details',
        subtitle: 'Access level and administrative information',
        component: AdminDetailsStep,
        validate: validateAdminDetails,
      },
      {
        label: 'Review & Confirm',
        subtitle: 'Review all information before creating the account',
        component: ReviewStep,
      },
    ],
  },
  
  receptionist: {
    title: 'Create Receptionist Account',
    submitButtonText: 'Create Receptionist',
    steps: [
      {
        label: 'Personal Information',
        subtitle: 'Basic personal details and account credentials',
        component: PersonalInfoStep,
        validate: validatePersonalInfo,
      },
      {
        label: 'Contact & Address',
        subtitle: 'Contact information and address details',
        component: ContactInfoStep,
        validate: validateContactInfo,
      },
      {
        label: 'Receptionist Details',
        subtitle: 'Reception area and language skills',
        component: ReceptionistDetailsStep,
      },
      {
        label: 'Review & Confirm',
        subtitle: 'Review all information before creating the account',
        component: ReviewStep,
      },
    ],
  },
  
  pharmacist: {
    title: 'Create Pharmacist Account',
    submitButtonText: 'Create Pharmacist',
    steps: [
      {
        label: 'Personal Information',
        subtitle: 'Basic personal details and account credentials',
        component: PersonalInfoStep,
        validate: validatePersonalInfo,
      },
      {
        label: 'Contact & Address',
        subtitle: 'Contact information and address details',
        component: ContactInfoStep,
        validate: validateContactInfo,
      },
      {
        label: 'Pharmacist Details',
        subtitle: 'Pharmacy license and professional information',
        component: PharmacistDetailsStep,
        validate: validatePharmacistDetails,
      },
      {
        label: 'Review & Confirm',
        subtitle: 'Review all information before creating the account',
        component: ReviewStep,
      },
    ],
  },
};

export default USER_FORM_CONFIGS;
