import * as dotenv from 'dotenv';
dotenv.config();

import { supabase } from '../config/supabase';

async function repairDatabase() {
  console.log('=== STARTING DATABASE REPAIR FOR CLASSES AND STUDENTS ===');

  try {
    // ----------------------------------------------------
    // 1. Repair Classes with null school_id
    // ----------------------------------------------------
    console.log('\n--- Step 1: Repairing classes with null school_id ---');
    const { data: classes, error: classesError } = await supabase
      .from('classes')
      .select('id, name, teacher_id, school_id')
      .is('school_id', null);

    if (classesError) {
      throw new Error(`Failed to fetch classes: ${classesError.message}`);
    }

    console.log(`Found ${classes?.length || 0} classes with null school_id.`);

    let classesRepairedCount = 0;
    if (classes && classes.length > 0) {
      for (const cls of classes) {
        console.log(`Resolving school for class "${cls.name}" (ID: ${cls.id})...`);
        const { data: teacherProfile, error: teacherError } = await supabase
          .from('profiles')
          .select('school_id')
          .eq('id', cls.teacher_id)
          .single();

        if (teacherError) {
          console.warn(`  Warning: Could not fetch teacher profile for teacher ID ${cls.teacher_id}: ${teacherError.message}`);
          continue;
        }

        if (teacherProfile && teacherProfile.school_id) {
          const { error: updateError } = await supabase
            .from('classes')
            .update({ school_id: teacherProfile.school_id })
            .eq('id', cls.id);

          if (updateError) {
            console.error(`  Error: Failed to update school_id for class ${cls.id}: ${updateError.message}`);
          } else {
            console.log(`  Success: Associated class "${cls.name}" with school ID ${teacherProfile.school_id}.`);
            classesRepairedCount++;
          }
        } else {
          console.warn(`  Warning: Teacher (ID: ${cls.teacher_id}) has no associated school_id.`);
        }
      }
    }
    console.log(`Step 1 complete. Repaired ${classesRepairedCount} classes.`);

    // ----------------------------------------------------
    // 2. Repair Student Profiles with null school_id or null/empty username
    // ----------------------------------------------------
    console.log('\n--- Step 2: Repairing student profiles with missing school_id or username ---');
    
    // Fetch all student profiles
    const { data: students, error: studentsError } = await supabase
      .from('profiles')
      .select('id, email, first_name, last_name, role, username, school_id')
      .eq('role', 'student');

    if (studentsError) {
      throw new Error(`Failed to fetch students: ${studentsError.message}`);
    }

    console.log(`Found ${students?.length || 0} total students in profiles.`);

    let profilesRepairedCount = 0;
    if (students && students.length > 0) {
      for (const student of students) {
        const needsSchool = !student.school_id;
        const needsUsername = !student.username || student.username.trim() === '';

        if (!needsSchool && !needsUsername) {
          continue; // Student is already valid
        }

        console.log(`Repairing student "${student.first_name} ${student.last_name}" (ID: ${student.id})...`);
        
        let resolvedSchoolId = student.school_id;
        if (needsSchool) {
          // Find class enrollment for this student to get the school_id
          const { data: enrollments, error: enrollError } = await supabase
            .from('class_students')
            .select('class_id, classes(school_id)')
            .eq('student_id', student.id);

          if (enrollError) {
            console.warn(`  Warning: Failed to fetch enrollments for student: ${enrollError.message}`);
          } else if (enrollments && enrollments.length > 0) {
            // Find first enrollment with a valid school_id
            for (const enrollment of enrollments) {
              const classSchoolId = (enrollment.classes as any)?.school_id;
              if (classSchoolId) {
                resolvedSchoolId = classSchoolId;
                console.log(`  Found school ID ${resolvedSchoolId} from enrolled class ${enrollment.class_id}.`);
                break;
              }
            }
          }
        }

        let generatedUsername = student.username;
        if (needsUsername) {
          if (resolvedSchoolId) {
            const { data: rpcUsername, error: rpcError } = await supabase.rpc('generate_username', {
              p_first_name: student.first_name,
              p_last_name: student.last_name,
              p_school_id: resolvedSchoolId,
            });
            if (!rpcError && rpcUsername) {
              generatedUsername = rpcUsername;
              console.log(`  Generated username via RPC: "${generatedUsername}".`);
            } else {
              console.warn(`  Warning: RPC generate_username failed: ${rpcError?.message}`);
            }
          }

          // Fallback username if RPC failed or school ID was missing
          if (!generatedUsername || generatedUsername.trim() === '') {
            const cleanFirst = student.first_name.toLowerCase().replace(/[^a-z0-9]/g, '');
            const cleanLast = student.last_name.toLowerCase().replace(/[^a-z0-9]/g, '');
            const rand = Math.floor(1000 + Math.random() * 9000);
            generatedUsername = `${cleanFirst}_${cleanLast}_${rand}`;
            console.log(`  Generated fallback username: "${generatedUsername}".`);
          }
        }

        // Update profiles table
        const { error: profileUpdateError } = await supabase
          .from('profiles')
          .update({
            school_id: resolvedSchoolId || null,
            username: generatedUsername || null,
          })
          .eq('id', student.id);

        if (profileUpdateError) {
          console.error(`  Error: Failed to update profile: ${profileUpdateError.message}`);
          continue;
        }

        // Also update Auth user metadata to keep auth user and profile metadata in sync
        const { error: authUpdateError } = await supabase.auth.admin.updateUserById(student.id, {
          user_metadata: {
            first_name: student.first_name,
            last_name: student.last_name,
            role: 'student',
            username: generatedUsername,
            school_id: resolvedSchoolId,
          }
        });

        if (authUpdateError) {
          console.warn(`  Warning: Failed to update auth metadata for student: ${authUpdateError.message}`);
        }

        console.log(`  Success: Updated profile with School: ${resolvedSchoolId || 'None'}, Username: ${generatedUsername}`);
        profilesRepairedCount++;
      }
    }
    console.log(`Step 2 complete. Repaired ${profilesRepairedCount} student profiles.`);

    console.log('\n=== DATABASE REPAIR COMPLETE ===');
  } catch (error: any) {
    console.error('CRITICAL ERROR during database repair:', error.message || error);
  }
}

repairDatabase();
