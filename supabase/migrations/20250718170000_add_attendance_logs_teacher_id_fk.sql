-- Migration: Add foreign key constraint to attendance_logs.teacher_id
-- Ensures attendance_logs.teacher_id references users(id)

ALTER TABLE attendance_logs
  ADD CONSTRAINT attendance_logs_teacher_id_fkey
  FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE;
