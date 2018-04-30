# Contributing to MMIS

ข้อแนะนำสำหรับการร่วมพัฒนาโปรแกรม MMIS

## Contribution Flow

Here are the typical steps in a contributor's workflow:

- [Fork](https://help.github.com/articles/fork-a-repo/) branch `develop`.
- Clone โปรเจคที่ได้ fork ไปแล้วไว้ในเครื่อง.
- กำหนดอีเมล์และชื่อของคุณใน Git configure เพื่อทำการ signing.
- สร้าง branch ใหม่เพื่อสร้าง pull request เช่น `patch-1`, `fixed-01`.
- ทำการทดสอบ build โดยใช้คำสั่ง `npm run build`.
- สร้าง commit.
- ทำการ push branch ที่กำลังแก้ไขขึ้น GitHub
- [สร้าง pull request](https://help.github.com/articles/about-pull-requests/).

ตัวอย่าง:

``` shell
# Clone your forked repository
git clone git@github.com:<github username>/mmis-<project name>.git

# Navigate to the directory
cd mmis-<project name>

# Set name and e-mail configuration
git config user.name "John Doe"
git config user.email johndoe@example.com

# Setup the upstream remote
git remote add upstream https://github.com/mophos/mmis-<project name>.git

# Create a topic branch for your changes
git checkout -b my-new-feature master

# After making the desired changes, test, commit and push to your fork
npm run build
git commit -a -s
git push origin my-new-feature
```

### Staying In Sync With Upstream

When your branch gets out of sync with the master branch, use the following to update:

``` shell
git checkout my-new-feature
git fetch -a
git pull --rebase upstream master
git push --force-with-lease origin my-new-feature
```

### Updating Pull Requests

If your PR fails to pass CI, or requires changes based on code review, you'll most likely want to squash these changes into existing commits.

If your pull request contains a single commit, or your changes are related to the most recent commit, you can amend the commit.

``` shell
git add .
git commit --amend
git push --force-with-lease origin my-new-feature
```

If you need to squash changes into an earlier commit, use the following:

``` shell
git add .
git commit --fixup <commit>
git rebase -i --autosquash master
git push --force-with-lease origin my-new-feature
```

Make sure you add a comment to the PR indicating that your changes are ready to review. GitHub does not generate a notification when you use git push.

### Formatting Commit Messages

Use this format for your commit message:

```
[<type>] <title>
<BLANK LINE>
<detailed commit message>
<BLANK LINE>
<reference to closing an issue>
<BLANK LINE>
Signed-off-by: Your Name <your.email@example.com>
```

#### Writing Guidelines

These documents provide guidance creating a well-crafted commit message:

 * [How to Write a Git Commit Message](http://chris.beams.io/posts/git-commit/)
 * [Closing Issues Via Commit Messages](https://help.github.com/articles/closing-issues-via-commit-messages/)

