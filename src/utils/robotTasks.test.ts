import test from 'node:test';
import assert from 'node:assert/strict';
import {
  FOUR_ROBOT_CONFIGS,
  computeWorkTaskPose,
  getRobotById,
  DEFAULT_REST_POSE,
} from './robotTasks.ts';

test('defines the 4 OfficeVerse AI employees (AURA, NOVA, PIXEL, ORBIT) with distinct roles', () => {
  assert.equal(FOUR_ROBOT_CONFIGS.length, 4);

  const names = FOUR_ROBOT_CONFIGS.map((r) => r.name);
  assert.deepEqual(names, ['AURA', 'NOVA', 'PIXEL', 'ORBIT']);

  const roles = new Set(FOUR_ROBOT_CONFIGS.map((r) => r.role));
  assert.equal(roles.size, 4);
  assert.ok(roles.has('manager'));
  assert.ok(roles.has('researcher'));
  assert.ok(roles.has('creator'));
  assert.ok(roles.has('reviewer'));
});

test('configures PC workstation employees (PIXEL and ORBIT) as seated on ergonomic chairs', () => {
  const pixel = getRobotById('robot-pixel');
  const orbit = getRobotById('robot-orbit');
  const aura = getRobotById('robot-aura');
  const nova = getRobotById('robot-nova');

  assert.ok(pixel?.isSeatedAtDesk);
  assert.ok(orbit?.isSeatedAtDesk);
  assert.equal(aura?.isSeatedAtDesk, false);
  assert.equal(nova?.isSeatedAtDesk, false);

  const creatorPose = computeWorkTaskPose('creator', 1.0);
  const reviewerPose = computeWorkTaskPose('reviewer', 1.0);
  // Seated employees have forward-bent legs on the chair seat
  assert.ok(creatorPose.leftLegRotX < -1.0);
  assert.ok(reviewerPose.leftLegRotX < -1.0);
});

test('places all 4 employees at non-overlapping coordinates inside the office', () => {
  for (let i = 0; i < FOUR_ROBOT_CONFIGS.length; i++) {
    for (let j = i + 1; j < FOUR_ROBOT_CONFIGS.length; j++) {
      const a = FOUR_ROBOT_CONFIGS[i].homePos;
      const b = FOUR_ROBOT_CONFIGS[j].homePos;
      const dist = Math.hypot(a.x - b.x, a.z - b.z);
      assert.ok(
        dist > 1.8,
        `Employees ${FOUR_ROBOT_CONFIGS[i].name} and ${FOUR_ROBOT_CONFIGS[j].name} are too close (${dist})`
      );
    }
  }
});

test('computes distinct specialized work poses for manager, researcher, creator, and reviewer', () => {
  const t = 1.25;
  const managerPose = computeWorkTaskPose('manager', t);
  const researcherPose = computeWorkTaskPose('researcher', t);
  const creatorPose = computeWorkTaskPose('creator', t);
  const reviewerPose = computeWorkTaskPose('reviewer', t);

  // Manager (AURA) raises left arm high to point at the Team Dashboard Wall
  assert.ok(managerPose.leftArmRotZ < -0.9);

  // Researcher (NOVA) tilts head down to read the Research Tablet held in front of chest
  assert.ok(researcherPose.headRotX > 0.15);
  assert.ok(researcherPose.leftArmRotX < -0.9);

  // Creator (PIXEL) and Reviewer (ORBIT) have active desk arm poses distinct from rest
  assert.notEqual(creatorPose.leftArmRotX, DEFAULT_REST_POSE.leftArmRotX);
  assert.notEqual(reviewerPose.rightArmRotX, DEFAULT_REST_POSE.rightArmRotX);
});
