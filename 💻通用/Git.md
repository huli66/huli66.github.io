
## 贮藏与清理

  

## 贮藏工作

  

改动之后希望切换分支，但是不希望提交之前的工作，所以贮藏修改

  

```sh

# 贮藏工作

git stash

git stash push

  

# 查看所有贮藏

git stash list

  

# 将刚刚的贮藏重新应用

git stash apply

# 应用一个指定版本的老贮藏

git stash apply stash@{2}

```

  

**应用贮藏并不要求一个干净的工作目录或者要求应用到贮藏时的分支，可以在一个分支上贮藏，然后应用到其他分支，当应用贮藏时分支工作目录可以有修改与未提交文件——如果有冲突会提示**

  

文件改动被重新应用，但是之前暂存的文件却没有重新暂存

  

```sh

# 重新应用暂存的修改

git stash apply --index

  

# 移除贮藏

git stash drop stash@{3}

  

# 应用贮藏并直接从栈上扔掉它

git stash pop

```

  

**git stash pop 应用最新贮藏然后立即从栈上移除**

  

## 贮藏的创意性使用

  

```sh

# 不仅贮藏所有已暂存的内容，还将它们保留在索引中

git stash --keep-index

  

# 默认 git stash 只会贮藏已跟踪文件

# --include-untracked 也会贮藏未跟踪文件

git stash --include-untracked

  

# --all 会包含明确忽略的文件

  

# --patch 交互式提示想改动哪些

```

  

## 从贮藏创建一个分支

  

```sh

# 创建一个新分支应用贮藏

git stash branch branchname

```

  

## 清理工作目录

  

```sh

# 移除没有忽略的未被跟踪文件

git clean

  

# 移除所有未追踪文件和空的子目录

git clean -f -d

  

# --dry-run -n，演示一次，提前看看会干啥

  

```