-- ==============================================================================
-- CaafimaadHub — Community Health Volunteer Coordination Platform
-- Database Schema for MySQL 8.0+ / MariaDB / XAMPP Compatible
-- Character Set: utf8mb4, Collation: utf8mb4_unicode_ci
-- ==============================================================================

CREATE DATABASE IF NOT EXISTS `caafimaadhub` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `caafimaadhub`;

SET FOREIGN_KEY_CHECKS = 0;

-- Drop existing tables to ensure clean migration if executed directly
DROP TABLE IF EXISTS `audit_logs`;
DROP TABLE IF EXISTS `attachments`;
DROP TABLE IF EXISTS `system_settings`;
DROP TABLE IF EXISTS `sms_logs`;
DROP TABLE IF EXISTS `notification_templates`;
DROP TABLE IF EXISTS `notifications`;
DROP TABLE IF EXISTS `supply_requests`;
DROP TABLE IF EXISTS `inventory_transactions`;
DROP TABLE IF EXISTS `inventory_locations`;
DROP TABLE IF EXISTS `inventory_items`;
DROP TABLE IF EXISTS `certificates`;
DROP TABLE IF EXISTS `training_answers`;
DROP TABLE IF EXISTS `training_questions`;
DROP TABLE IF EXISTS `training_quizzes`;
DROP TABLE IF EXISTS `training_enrollments`;
DROP TABLE IF EXISTS `training_materials`;
DROP TABLE IF EXISTS `training_lessons`;
DROP TABLE IF EXISTS `training_courses`;
DROP TABLE IF EXISTS `field_submission_values`;
DROP TABLE IF EXISTS `field_submissions`;
DROP TABLE IF EXISTS `field_form_fields`;
DROP TABLE IF EXISTS `field_forms`;
DROP TABLE IF EXISTS `schedules`;
DROP TABLE IF EXISTS `task_assignments`;
DROP TABLE IF EXISTS `tasks`;
DROP TABLE IF EXISTS `campaign_volunteers`;
DROP TABLE IF EXISTS `campaigns`;
DROP TABLE IF EXISTS `volunteer_languages`;
DROP TABLE IF EXISTS `volunteer_skills`;
DROP TABLE IF EXISTS `volunteers`;
DROP TABLE IF EXISTS `emergency_reports`;
DROP TABLE IF EXISTS `feedback`;
DROP TABLE IF EXISTS `facilities`;
DROP TABLE IF EXISTS `communities`;
DROP TABLE IF EXISTS `districts`;
DROP TABLE IF EXISTS `regions`;
DROP TABLE IF EXISTS `user_roles`;
DROP TABLE IF EXISTS `role_permissions`;
DROP TABLE IF EXISTS `permissions`;
DROP TABLE IF EXISTS `roles`;
DROP TABLE IF EXISTS `users`;
DROP TABLE IF EXISTS `organizations`;

SET FOREIGN_KEY_CHECKS = 1;

-- 1. Organizations Table
CREATE TABLE `organizations` (
  `id` VARCHAR(36) PRIMARY KEY,
  `name` VARCHAR(150) NOT NULL,
  `code` VARCHAR(50) UNIQUE NOT NULL,
  `type` ENUM('MOH', 'NGO', 'HOSPITAL', 'HEALTH_PROGRAM', 'COMMUNITY_ORG', 'UN_AGENCY') NOT NULL DEFAULT 'NGO',
  `contact_email` VARCHAR(100),
  `contact_phone` VARCHAR(30),
  `address` TEXT,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Geographic Hierarchy: Regions
CREATE TABLE `regions` (
  `id` VARCHAR(36) PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `code` VARCHAR(30) UNIQUE NOT NULL,
  `country` VARCHAR(50) DEFAULT 'Somalia',
  `latitude` DECIMAL(10, 8),
  `longitude` DECIMAL(11, 8),
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Geographic Hierarchy: Districts
CREATE TABLE `districts` (
  `id` VARCHAR(36) PRIMARY KEY,
  `region_id` VARCHAR(36) NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `code` VARCHAR(30) NOT NULL,
  `latitude` DECIMAL(10, 8),
  `longitude` DECIMAL(11, 8),
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`region_id`) REFERENCES `regions`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. Geographic Hierarchy: Communities / Villages
CREATE TABLE `communities` (
  `id` VARCHAR(36) PRIMARY KEY,
  `district_id` VARCHAR(36) NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `code` VARCHAR(30),
  `population_estimate` INT DEFAULT 0,
  `latitude` DECIMAL(10, 8),
  `longitude` DECIMAL(11, 8),
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`district_id`) REFERENCES `districts`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. Facilities / Health Centers
CREATE TABLE `facilities` (
  `id` VARCHAR(36) PRIMARY KEY,
  `organization_id` VARCHAR(36),
  `district_id` VARCHAR(36) NOT NULL,
  `name` VARCHAR(150) NOT NULL,
  `code` VARCHAR(50),
  `facility_type` ENUM('HOSPITAL', 'HEALTH_CENTER', 'MCH', 'PRIMARY_HEALTH_UNIT', 'MOBILE_CLINIC') DEFAULT 'HEALTH_CENTER',
  `contact_person` VARCHAR(100),
  `phone` VARCHAR(30),
  `latitude` DECIMAL(10, 8),
  `longitude` DECIMAL(11, 8),
  `is_active` TINYINT(1) DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`district_id`) REFERENCES `districts`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 6. Users
CREATE TABLE `users` (
  `id` VARCHAR(36) PRIMARY KEY,
  `organization_id` VARCHAR(36),
  `region_id` VARCHAR(36),
  `district_id` VARCHAR(36),
  `email` VARCHAR(120) UNIQUE NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `full_name` VARCHAR(150) NOT NULL,
  `phone` VARCHAR(30),
  `gender` ENUM('MALE', 'FEMALE', 'OTHER') DEFAULT 'OTHER',
  `date_of_birth` DATE NULL,
  `profile_image_url` LONGTEXT,
  `avatar_url` LONGTEXT,
  `role` ENUM('Superadmin', 'Admin', 'DataAnalyst', 'Volunteer', 'Public') NOT NULL DEFAULT 'Public',
  `status` ENUM('pending', 'active', 'deactivated') NOT NULL DEFAULT 'active',
  `region` VARCHAR(100) DEFAULT 'Banadir',
  `district` VARCHAR(100) DEFAULT 'Hodan',
  `village_neighbourhood` VARCHAR(150),
  `latitude` DECIMAL(10, 8),
  `longitude` DECIMAL(11, 8),
  `education_level` VARCHAR(100),
  `languages_spoken` JSON,
  `motivation_background` TEXT,
  `emergency_contact_name` VARCHAR(120),
  `emergency_contact_phone` VARCHAR(30),
  `preferred_language` VARCHAR(10) DEFAULT 'so',
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `is_suspended` TINYINT(1) NOT NULL DEFAULT 0,
  `suspension_reason` TEXT,
  `last_login` TIMESTAMP NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`region_id`) REFERENCES `regions`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`district_id`) REFERENCES `districts`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 7. Roles & Permissions
CREATE TABLE `roles` (
  `id` VARCHAR(36) PRIMARY KEY,
  `name` VARCHAR(50) UNIQUE NOT NULL,
  `display_name` VARCHAR(100) NOT NULL,
  `description` TEXT,
  `is_system_role` TINYINT(1) DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `permissions` (
  `id` VARCHAR(36) PRIMARY KEY,
  `code` VARCHAR(80) UNIQUE NOT NULL,
  `module` VARCHAR(50) NOT NULL,
  `description` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `role_permissions` (
  `role_id` VARCHAR(36) NOT NULL,
  `permission_id` VARCHAR(36) NOT NULL,
  PRIMARY KEY (`role_id`, `permission_id`),
  FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`permission_id`) REFERENCES `permissions`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `user_roles` (
  `user_id` VARCHAR(36) NOT NULL,
  `role_id` VARCHAR(36) NOT NULL,
  PRIMARY KEY (`user_id`, `role_id`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 8. Volunteers Profile
CREATE TABLE `volunteers` (
  `id` VARCHAR(36) PRIMARY KEY,
  `user_id` VARCHAR(36) UNIQUE NOT NULL,
  `volunteer_id` VARCHAR(50) UNIQUE NOT NULL,
  `organization_id` VARCHAR(36),
  `gender` ENUM('MALE', 'FEMALE', 'OTHER') NOT NULL,
  `date_of_birth` DATE,
  `region_id` VARCHAR(36) NOT NULL,
  `district_id` VARCHAR(36) NOT NULL,
  `community_id` VARCHAR(36),
  `village_name` VARCHAR(100),
  `address` TEXT,
  `latitude` DECIMAL(10, 8),
  `longitude` DECIMAL(11, 8),
  `education_level` VARCHAR(100),
  `health_qualifications` TEXT,
  `previous_experience` TEXT,
  `emergency_contact_name` VARCHAR(120),
  `emergency_contact_phone` VARCHAR(30),
  `emergency_contact_relationship` VARCHAR(50),
  `availability_status` ENUM('AVAILABLE', 'BUSY', 'UNAVAILABLE', 'ON_LEAVE') DEFAULT 'AVAILABLE',
  `status` ENUM('PENDING', 'UNDER_REVIEW', 'APPROVED', 'ACTIVE', 'INACTIVE', 'SUSPENDED', 'REJECTED') DEFAULT 'PENDING',
  `reviewed_by` VARCHAR(36),
  `reviewed_at` TIMESTAMP NULL,
  `review_notes` TEXT,
  `profile_completed` TINYINT(1) DEFAULT 0,
  `registration_date` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`region_id`) REFERENCES `regions`(`id`) ON DELETE RESTRICT,
  FOREIGN KEY (`district_id`) REFERENCES `districts`(`id`) ON DELETE RESTRICT,
  FOREIGN KEY (`community_id`) REFERENCES `communities`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`reviewed_by`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `volunteer_skills` (
  `id` VARCHAR(36) PRIMARY KEY,
  `volunteer_id` VARCHAR(36) NOT NULL,
  `skill` VARCHAR(100) NOT NULL,
  FOREIGN KEY (`volunteer_id`) REFERENCES `volunteers`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `volunteer_languages` (
  `id` VARCHAR(36) PRIMARY KEY,
  `volunteer_id` VARCHAR(36) NOT NULL,
  `language` VARCHAR(50) NOT NULL,
  `proficiency` ENUM('NATIVE', 'FLUENT', 'INTERMEDIATE', 'BASIC') DEFAULT 'FLUENT',
  FOREIGN KEY (`volunteer_id`) REFERENCES `volunteers`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 9. Campaigns
CREATE TABLE `campaigns` (
  `id` VARCHAR(36) PRIMARY KEY,
  `organization_id` VARCHAR(36),
  `name` VARCHAR(180) NOT NULL,
  `code` VARCHAR(50) UNIQUE NOT NULL,
  `type` ENUM('POLIO', 'MALARIA', 'MATERNAL_HEALTH', 'CHILD_HEALTH', 'NUTRITION', 'IMMUNIZATION', 'DISEASE_AWARENESS', 'HYGIENE', 'TB', 'COVID_RESPIRATORY', 'EMERGENCY_RESPONSE', 'OTHER') NOT NULL,
  `description` TEXT,
  `objective` TEXT,
  `start_date` DATE NOT NULL,
  `end_date` DATE NOT NULL,
  `region_id` VARCHAR(36) NOT NULL,
  `district_id` VARCHAR(36),
  `target_communities` TEXT,
  `target_population` INT DEFAULT 0,
  `budget` DECIMAL(12, 2) DEFAULT 0.00,
  `currency` VARCHAR(10) DEFAULT 'USD',
  `manager_id` VARCHAR(36),
  `status` ENUM('DRAFT', 'PLANNED', 'ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED') DEFAULT 'DRAFT',
  `priority` ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL') DEFAULT 'MEDIUM',
  `required_volunteers` INT DEFAULT 0,
  `required_supplies` TEXT,
  `training_requirements` TEXT,
  `attachments` JSON,
  `created_by` VARCHAR(36),
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`region_id`) REFERENCES `regions`(`id`) ON DELETE RESTRICT,
  FOREIGN KEY (`district_id`) REFERENCES `districts`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`manager_id`) REFERENCES `users`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `campaign_volunteers` (
  `id` VARCHAR(36) PRIMARY KEY,
  `campaign_id` VARCHAR(36) NOT NULL,
  `volunteer_id` VARCHAR(36) NOT NULL,
  `status` ENUM('ASSIGNED', 'ACCEPTED', 'DECLINED', 'ACTIVE', 'COMPLETED') DEFAULT 'ASSIGNED',
  `assigned_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_camp_vol` (`campaign_id`, `volunteer_id`),
  FOREIGN KEY (`campaign_id`) REFERENCES `campaigns`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`volunteer_id`) REFERENCES `volunteers`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 10. Tasks & Schedules
CREATE TABLE `tasks` (
  `id` VARCHAR(36) PRIMARY KEY,
  `campaign_id` VARCHAR(36),
  `organization_id` VARCHAR(36),
  `title` VARCHAR(180) NOT NULL,
  `task_type` ENUM('IMMUNIZATION', 'MALARIA_SURVEILLANCE', 'NUTRITION_SCREENING', 'HEALTH_EDUCATION', 'DISTRIBUTION', 'COMMUNITY_ASSESSMENT', 'FOLLOW_UP', 'OTHER') NOT NULL,
  `description` TEXT,
  `instructions` TEXT,
  `priority` ENUM('LOW', 'MEDIUM', 'HIGH', 'URGENT') DEFAULT 'MEDIUM',
  `status` ENUM('ASSIGNED', 'ACCEPTED', 'REJECTED', 'IN_PROGRESS', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'COMPLETED', 'CANCELLED') DEFAULT 'ASSIGNED',
  `region_id` VARCHAR(36) NOT NULL,
  `district_id` VARCHAR(36) NOT NULL,
  `community_id` VARCHAR(36),
  `target_location_name` VARCHAR(150),
  `latitude` DECIMAL(10, 8),
  `longitude` DECIMAL(11, 8),
  `start_datetime` DATETIME NOT NULL,
  `deadline_datetime` DATETIME NOT NULL,
  `requires_field_data` TINYINT(1) DEFAULT 1,
  `field_form_id` VARCHAR(36),
  `required_training_id` VARCHAR(36),
  `required_supplies` TEXT,
  `is_recurring` TINYINT(1) DEFAULT 0,
  `recurrence_pattern` VARCHAR(50),
  `created_by` VARCHAR(36),
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`campaign_id`) REFERENCES `campaigns`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`region_id`) REFERENCES `regions`(`id`) ON DELETE RESTRICT,
  FOREIGN KEY (`district_id`) REFERENCES `districts`(`id`) ON DELETE RESTRICT,
  FOREIGN KEY (`community_id`) REFERENCES `communities`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `task_assignments` (
  `id` VARCHAR(36) PRIMARY KEY,
  `task_id` VARCHAR(36) NOT NULL,
  `volunteer_id` VARCHAR(36) NOT NULL,
  `status` ENUM('ASSIGNED', 'ACCEPTED', 'REJECTED', 'IN_PROGRESS', 'SUBMITTED', 'COMPLETED', 'CANCELLED') DEFAULT 'ASSIGNED',
  `rejection_reason` TEXT,
  `assigned_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `accepted_at` DATETIME,
  `completed_at` DATETIME,
  UNIQUE KEY `uk_task_assignment` (`task_id`, `volunteer_id`),
  FOREIGN KEY (`task_id`) REFERENCES `tasks`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`volunteer_id`) REFERENCES `volunteers`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `schedules` (
  `id` VARCHAR(36) PRIMARY KEY,
  `volunteer_id` VARCHAR(36) NOT NULL,
  `task_id` VARCHAR(36),
  `campaign_id` VARCHAR(36),
  `title` VARCHAR(150) NOT NULL,
  `start_time` DATETIME NOT NULL,
  `end_time` DATETIME NOT NULL,
  `is_available` TINYINT(1) DEFAULT 1,
  `notes` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`volunteer_id`) REFERENCES `volunteers`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`task_id`) REFERENCES `tasks`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`campaign_id`) REFERENCES `campaigns`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 11. Field Forms & Data Collection
CREATE TABLE `field_forms` (
  `id` VARCHAR(36) PRIMARY KEY,
  `title` VARCHAR(150) NOT NULL,
  `code` VARCHAR(50) UNIQUE NOT NULL,
  `category` ENUM('IMMUNIZATION', 'MALARIA', 'NUTRITION', 'MATERNAL_HEALTH', 'EPIDEMIC_SURVEILLANCE', 'COMMUNITY_WASH', 'GENERAL') NOT NULL,
  `description` TEXT,
  `schema_json` JSON NOT NULL,
  `is_active` TINYINT(1) DEFAULT 1,
  `version` INT DEFAULT 1,
  `created_by` VARCHAR(36),
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `field_form_fields` (
  `id` VARCHAR(36) PRIMARY KEY,
  `field_form_id` VARCHAR(36) NOT NULL,
  `field_name` VARCHAR(80) NOT NULL,
  `field_label` VARCHAR(150) NOT NULL,
  `field_type` ENUM('TEXT', 'NUMBER', 'SELECT', 'MULTISELECT', 'DATE', 'BOOLEAN', 'GPS', 'PHOTO', 'TEXTAREA') NOT NULL,
  `options_json` JSON,
  `is_required` TINYINT(1) DEFAULT 0,
  `validation_rules` JSON,
  `order_index` INT DEFAULT 0,
  FOREIGN KEY (`field_form_id`) REFERENCES `field_forms`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `field_submissions` (
  `id` VARCHAR(36) PRIMARY KEY,
  `local_id` VARCHAR(80),
  `volunteer_id` VARCHAR(36) NOT NULL,
  `task_id` VARCHAR(36),
  `campaign_id` VARCHAR(36),
  `field_form_id` VARCHAR(36) NOT NULL,
  `submission_datetime` DATETIME NOT NULL,
  `latitude` DECIMAL(10, 8),
  `longitude` DECIMAL(11, 8),
  `accuracy_meters` DECIMAL(8, 2),
  `location_description` VARCHAR(200),
  `payload_data` JSON NOT NULL,
  `summary_metrics` JSON,
  `sync_status` ENUM('SYNCED', 'PENDING', 'CONFLICT', 'FAILED') DEFAULT 'SYNCED',
  `sync_attempts` INT DEFAULT 1,
  `last_sync_time` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `review_status` ENUM('PENDING', 'APPROVED', 'REJECTED', 'FLAGGED') DEFAULT 'PENDING',
  `reviewed_by` VARCHAR(36),
  `reviewed_at` DATETIME,
  `review_comments` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`volunteer_id`) REFERENCES `volunteers`(`id`) ON DELETE RESTRICT,
  FOREIGN KEY (`task_id`) REFERENCES `tasks`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`campaign_id`) REFERENCES `campaigns`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`field_form_id`) REFERENCES `field_forms`(`id`) ON DELETE RESTRICT,
  FOREIGN KEY (`reviewed_by`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 12. Training Management & Certificates
CREATE TABLE `training_courses` (
  `id` VARCHAR(36) PRIMARY KEY,
  `title` VARCHAR(180) NOT NULL,
  `code` VARCHAR(50) UNIQUE NOT NULL,
  `category` ENUM('IMMUNIZATION', 'MALARIA', 'NUTRITION', 'MATERNAL_HEALTH', 'HYGIENE', 'DISEASE_PREVENTION', 'FIELD_DATA_COLLECTION', 'EMERGENCY_RESPONSE', 'VOLUNTEER_ETHICS', 'DATA_PRIVACY') NOT NULL,
  `description` TEXT,
  `thumbnail_url` VARCHAR(255),
  `estimated_hours` DECIMAL(4, 1) DEFAULT 1.0,
  `passing_score_percentage` INT DEFAULT 80,
  `is_published` TINYINT(1) DEFAULT 1,
  `created_by` VARCHAR(36),
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `training_lessons` (
  `id` VARCHAR(36) PRIMARY KEY,
  `course_id` VARCHAR(36) NOT NULL,
  `title` VARCHAR(180) NOT NULL,
  `lesson_order` INT NOT NULL DEFAULT 1,
  `content_type` ENUM('TEXT', 'VIDEO', 'PDF', 'IMAGE', 'INTERACTIVE') NOT NULL DEFAULT 'TEXT',
  `body_content` LONGTEXT,
  `media_url` VARCHAR(255),
  `duration_minutes` INT DEFAULT 15,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`course_id`) REFERENCES `training_courses`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `training_enrollments` (
  `id` VARCHAR(36) PRIMARY KEY,
  `course_id` VARCHAR(36) NOT NULL,
  `volunteer_id` VARCHAR(36) NOT NULL,
  `status` ENUM('ENROLLED', 'IN_PROGRESS', 'COMPLETED', 'FAILED') DEFAULT 'ENROLLED',
  `progress_percentage` INT DEFAULT 0,
  `quiz_score` INT DEFAULT NULL,
  `completed_at` DATETIME NULL,
  `enrolled_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_course_volunteer` (`course_id`, `volunteer_id`),
  FOREIGN KEY (`course_id`) REFERENCES `training_courses`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`volunteer_id`) REFERENCES `volunteers`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `training_quizzes` (
  `id` VARCHAR(36) PRIMARY KEY,
  `course_id` VARCHAR(36) NOT NULL,
  `title` VARCHAR(150) NOT NULL,
  `description` TEXT,
  `time_limit_minutes` INT DEFAULT 20,
  `passing_score` INT DEFAULT 80,
  FOREIGN KEY (`course_id`) REFERENCES `training_courses`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `training_questions` (
  `id` VARCHAR(36) PRIMARY KEY,
  `quiz_id` VARCHAR(36) NOT NULL,
  `question_text` TEXT NOT NULL,
  `question_type` ENUM('SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'TRUE_FALSE') DEFAULT 'SINGLE_CHOICE',
  `points` INT DEFAULT 10,
  `order_index` INT DEFAULT 0,
  FOREIGN KEY (`quiz_id`) REFERENCES `training_quizzes`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `training_answers` (
  `id` VARCHAR(36) PRIMARY KEY,
  `question_id` VARCHAR(36) NOT NULL,
  `answer_text` TEXT NOT NULL,
  `is_correct` TINYINT(1) DEFAULT 0,
  `explanation` TEXT,
  FOREIGN KEY (`question_id`) REFERENCES `training_questions`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `certificates` (
  `id` VARCHAR(36) PRIMARY KEY,
  `certificate_number` VARCHAR(60) UNIQUE NOT NULL,
  `volunteer_id` VARCHAR(36) NOT NULL,
  `course_id` VARCHAR(36) NOT NULL,
  `issue_date` DATE NOT NULL,
  `expiry_date` DATE,
  `score_achieved` INT NOT NULL,
  `verification_code` VARCHAR(50) UNIQUE NOT NULL,
  `created_by` VARCHAR(36),
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`volunteer_id`) REFERENCES `volunteers`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`course_id`) REFERENCES `training_courses`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 13. Inventory & Health Supply Chain
CREATE TABLE `inventory_locations` (
  `id` VARCHAR(36) PRIMARY KEY,
  `facility_id` VARCHAR(36),
  `name` VARCHAR(120) NOT NULL,
  `code` VARCHAR(50) UNIQUE NOT NULL,
  `region_id` VARCHAR(36) NOT NULL,
  `district_id` VARCHAR(36) NOT NULL,
  `address` TEXT,
  FOREIGN KEY (`facility_id`) REFERENCES `facilities`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`region_id`) REFERENCES `regions`(`id`) ON DELETE RESTRICT,
  FOREIGN KEY (`district_id`) REFERENCES `districts`(`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `inventory_items` (
  `id` VARCHAR(36) PRIMARY KEY,
  `item_code` VARCHAR(50) UNIQUE NOT NULL,
  `name` VARCHAR(150) NOT NULL,
  `category` ENUM('VACCINES', 'SYRINGES', 'PPE', 'MEDICINES', 'MALARIA_NETS', 'NUTRITION_SUPPLIES', 'EDUCATIONAL_MATERIALS', 'FIRST_AID', 'DIAGNOSTIC_KITS', 'OTHER') NOT NULL,
  `unit_of_measure` VARCHAR(30) NOT NULL DEFAULT 'units',
  `quantity_on_hand` INT NOT NULL DEFAULT 0,
  `minimum_stock_level` INT NOT NULL DEFAULT 10,
  `location_id` VARCHAR(36),
  `batch_number` VARCHAR(80),
  `expiry_date` DATE,
  `supplier_name` VARCHAR(120),
  `unit_cost` DECIMAL(10, 2) DEFAULT 0.00,
  `notes` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`location_id`) REFERENCES `inventory_locations`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `inventory_transactions` (
  `id` VARCHAR(36) PRIMARY KEY,
  `item_id` VARCHAR(36) NOT NULL,
  `transaction_type` ENUM('STOCK_IN', 'STOCK_OUT', 'TRANSFER', 'ADJUSTMENT', 'VOLUNTEER_ISSUE', 'RETURN', 'DAMAGED_EXPIRED') NOT NULL,
  `quantity` INT NOT NULL,
  `balance_after` INT NOT NULL,
  `from_location_id` VARCHAR(36),
  `to_location_id` VARCHAR(36),
  `reference_number` VARCHAR(100),
  `performed_by` VARCHAR(36) NOT NULL,
  `notes` TEXT,
  `transaction_datetime` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`item_id`) REFERENCES `inventory_items`(`id`) ON DELETE RESTRICT,
  FOREIGN KEY (`from_location_id`) REFERENCES `inventory_locations`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`to_location_id`) REFERENCES `inventory_locations`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`performed_by`) REFERENCES `users`(`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `supply_requests` (
  `id` VARCHAR(36) PRIMARY KEY,
  `request_code` VARCHAR(50) UNIQUE NOT NULL,
  `volunteer_id` VARCHAR(36) NOT NULL,
  `task_id` VARCHAR(36),
  `campaign_id` VARCHAR(36),
  `item_id` VARCHAR(36) NOT NULL,
  `requested_quantity` INT NOT NULL,
  `approved_quantity` INT DEFAULT 0,
  `status` ENUM('REQUESTED', 'UNDER_REVIEW', 'APPROVED', 'ISSUED', 'RECEIVED', 'REJECTED', 'CANCELLED') DEFAULT 'REQUESTED',
  `urgency` ENUM('LOW', 'MEDIUM', 'HIGH', 'EMERGENCY') DEFAULT 'MEDIUM',
  `reason` TEXT,
  `reviewed_by` VARCHAR(36),
  `reviewed_at` DATETIME,
  `admin_remarks` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`volunteer_id`) REFERENCES `volunteers`(`id`) ON DELETE RESTRICT,
  FOREIGN KEY (`task_id`) REFERENCES `tasks`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`campaign_id`) REFERENCES `campaigns`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`item_id`) REFERENCES `inventory_items`(`id`) ON DELETE RESTRICT,
  FOREIGN KEY (`reviewed_by`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 14. Notifications & SMS Alerts
CREATE TABLE `notifications` (
  `id` VARCHAR(36) PRIMARY KEY,
  `user_id` VARCHAR(36) NOT NULL,
  `title` VARCHAR(180) NOT NULL,
  `message` TEXT NOT NULL,
  `type` ENUM('TASK_ASSIGNED', 'TASK_REMINDER', 'TASK_UPDATE', 'CAMPAIGN_ANNOUNCEMENT', 'TRAINING_ASSIGNED', 'LOW_INVENTORY', 'REPORT_STATUS', 'EMERGENCY_ALERT', 'SYSTEM') NOT NULL,
  `action_url` VARCHAR(255),
  `is_read` TINYINT(1) DEFAULT 0,
  `read_at` DATETIME,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `notification_templates` (
  `id` VARCHAR(36) PRIMARY KEY,
  `code` VARCHAR(80) UNIQUE NOT NULL,
  `name` VARCHAR(120) NOT NULL,
  `channel` ENUM('IN_APP', 'SMS', 'EMAIL') DEFAULT 'IN_APP',
  `title_template_en` VARCHAR(200),
  `title_template_so` VARCHAR(200),
  `body_template_en` TEXT NOT NULL,
  `body_template_so` TEXT NOT NULL,
  `is_active` TINYINT(1) DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `sms_logs` (
  `id` VARCHAR(36) PRIMARY KEY,
  `recipient_phone` VARCHAR(30) NOT NULL,
  `recipient_user_id` VARCHAR(36),
  `message_body` TEXT NOT NULL,
  `provider` VARCHAR(50) DEFAULT 'MOCK_PROVIDER',
  `provider_message_id` VARCHAR(100),
  `status` ENUM('QUEUED', 'SENT', 'DELIVERED', 'FAILED') DEFAULT 'QUEUED',
  `error_details` TEXT,
  `retry_count` INT DEFAULT 0,
  `sent_at` DATETIME,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`recipient_user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 15. Community Feedback & Emergency Disease Outbreak Reports
CREATE TABLE `feedback` (
  `id` VARCHAR(36) PRIMARY KEY,
  `ticket_number` VARCHAR(50) UNIQUE NOT NULL,
  `category` ENUM('FEEDBACK', 'COMPLAINT', 'HEALTH_CONCERN', 'SERVICE_REQUEST', 'SUGGESTION', 'EMERGENCY_REPORT') NOT NULL,
  `description` TEXT NOT NULL,
  `region_id` VARCHAR(36),
  `district_id` VARCHAR(36),
  `location_name` VARCHAR(150),
  `reporter_name` VARCHAR(100),
  `reporter_phone` VARCHAR(30),
  `reporter_email` VARCHAR(100),
  `status` ENUM('NEW', 'RECEIVED', 'UNDER_REVIEW', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'REJECTED') DEFAULT 'NEW',
  `admin_notes` TEXT,
  `resolved_by` VARCHAR(36),
  `resolved_at` DATETIME,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`region_id`) REFERENCES `regions`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`district_id`) REFERENCES `districts`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`resolved_by`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `emergency_reports` (
  `id` VARCHAR(36) PRIMARY KEY,
  `report_code` VARCHAR(50) UNIQUE NOT NULL,
  `emergency_type` ENUM('DISEASE_OUTBREAK', 'SUSPECTED_CLUSTER', 'MALNUTRITION_SPIKE', 'MEDICAL_EMERGENCY', 'SUPPLY_SHORTAGE', 'UNSAFE_FACILITY', 'WATER_CONTAMINATION', 'OTHER') NOT NULL,
  `severity` ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL') NOT NULL DEFAULT 'HIGH',
  `description` TEXT NOT NULL,
  `suspected_cases_count` INT DEFAULT 0,
  `region_id` VARCHAR(36) NOT NULL,
  `district_id` VARCHAR(36) NOT NULL,
  `community_name` VARCHAR(120),
  `latitude` DECIMAL(10, 8),
  `longitude` DECIMAL(11, 8),
  `reporter_type` ENUM('VOLUNTEER', 'PUBLIC', 'HEALTH_WORKER', 'COMMUNITY_LEADER') NOT NULL DEFAULT 'VOLUNTEER',
  `reporter_user_id` VARCHAR(36),
  `reporter_name` VARCHAR(120),
  `reporter_phone` VARCHAR(30),
  `status` ENUM('REPORTED', 'INVESTIGATING', 'ACTION_TAKEN', 'RESOLVED', 'FALSE_ALARM') DEFAULT 'REPORTED',
  `investigation_notes` TEXT,
  `action_taken` TEXT,
  `resolved_by` VARCHAR(36),
  `resolved_at` DATETIME,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`region_id`) REFERENCES `regions`(`id`) ON DELETE RESTRICT,
  FOREIGN KEY (`district_id`) REFERENCES `districts`(`id`) ON DELETE RESTRICT,
  FOREIGN KEY (`reporter_user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`resolved_by`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 16. Attachments, Audit Logs & System Settings
CREATE TABLE `attachments` (
  `id` VARCHAR(36) PRIMARY KEY,
  `entity_type` VARCHAR(50) NOT NULL,
  `entity_id` VARCHAR(36) NOT NULL,
  `file_name` VARCHAR(200) NOT NULL,
  `file_path` VARCHAR(255) NOT NULL,
  `file_size_bytes` INT NOT NULL,
  `mime_type` VARCHAR(100) NOT NULL,
  `uploaded_by` VARCHAR(36),
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`uploaded_by`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `audit_logs` (
  `id` VARCHAR(36) PRIMARY KEY,
  `user_id` VARCHAR(36),
  `user_email` VARCHAR(120),
  `action` VARCHAR(100) NOT NULL,
  `module` VARCHAR(50) NOT NULL,
  `entity_name` VARCHAR(50) NOT NULL,
  `entity_id` VARCHAR(36),
  `old_values` JSON,
  `new_values` JSON,
  `ip_address` VARCHAR(50),
  `user_agent` VARCHAR(255),
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `system_settings` (
  `setting_key` VARCHAR(80) PRIMARY KEY,
  `setting_value` TEXT NOT NULL,
  `category` VARCHAR(50) DEFAULT 'GENERAL',
  `description` TEXT,
  `is_public` TINYINT(1) DEFAULT 0,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Indexes for maximum query performance in high-scale field operations
CREATE INDEX `idx_users_email` ON `users` (`email`);
CREATE INDEX `idx_volunteers_status` ON `volunteers` (`status`);
CREATE INDEX `idx_volunteers_region` ON `volunteers` (`region_id`, `district_id`);
CREATE INDEX `idx_campaigns_status` ON `campaigns` (`status`);
CREATE INDEX `idx_tasks_status` ON `tasks` (`status`);
CREATE INDEX `idx_tasks_deadline` ON `tasks` (`deadline_datetime`);
CREATE INDEX `idx_field_sub_vol` ON `field_submissions` (`volunteer_id`);
CREATE INDEX `idx_field_sub_date` ON `field_submissions` (`submission_datetime`);
CREATE INDEX `idx_inventory_qty` ON `inventory_items` (`quantity_on_hand`);
CREATE INDEX `idx_audit_module` ON `audit_logs` (`module`, `action`);
CREATE INDEX `idx_emergency_sev` ON `emergency_reports` (`severity`, `status`);
