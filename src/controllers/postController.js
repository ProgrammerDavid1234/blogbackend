const Post = require('../models/Post');
const Category = require('../models/Category');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Get all posts (public)
// @route   GET /api/v1/posts
// @access  Public
exports.getPosts = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const query = { status: 'published' };

    if (req.query.category) query.category = req.query.category;
    if (req.query.author) query.author = req.query.author;
    if (req.query.tag) query.tags = req.query.tag;

    if (req.query.q) {
      query.$text = { $search: req.query.q };
    }

    if (req.query.startDate || req.query.endDate) {
      query.publishedAt = {};
      if (req.query.startDate) query.publishedAt.$gte = new Date(req.query.startDate);
      if (req.query.endDate) query.publishedAt.$lte = new Date(req.query.endDate);
    }

    const sort = {};
    if (req.query.sort === 'popular') sort.viewCount = -1;
    else if (req.query.sort === 'oldest') sort.publishedAt = 1;
    else sort.publishedAt = -1;

    const [posts, total] = await Promise.all([
      Post.find(query)
        .populate('author', 'name profileImage')
        .populate('category', 'name slug')
        .skip(skip)
        .limit(limit)
        .sort(sort),
      Post.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      count: posts.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: posts,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single post by id or slug
// @route   GET /api/v1/posts/:idOrSlug
// @access  Public
exports.getPost = async (req, res, next) => {
  try {
    const param = req.params.idOrSlug;
    const isObjectId = param.match(/^[0-9a-fA-F]{24}$/);

    const query = isObjectId ? { _id: param } : { slug: param };

    const post = await Post.findOne(query)
      .populate('author', 'name profileImage')
      .populate('category', 'name slug')
      .populate('comments');

    if (!post || post.status !== 'published') {
      return next(new ErrorResponse('Post not found', 404));
    }

    // increment view count (non-blocking)
    post.incrementViewCount().catch(() => { });

    res.status(200).json({ success: true, data: post });
  } catch (err) {
    next(err);
  }
};

// @desc    Get recent posts
// @route   GET /api/v1/posts/recent
// @access  Public
exports.getRecentPosts = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 5;
    const posts = await Post.find({ status: 'published' })
      .sort({ publishedAt: -1 })
      .limit(limit)
      .populate('author', 'name profileImage');

    res.status(200).json({ success: true, data: posts });
  } catch (err) {
    next(err);
  }
};

// @desc    Get popular posts
// @route   GET /api/v1/posts/popular
// @access  Public
exports.getPopularPosts = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 5;
    const posts = await Post.find({ status: 'published' })
      .sort({ viewCount: -1 })
      .limit(limit)
      .populate('author', 'name profileImage');

    res.status(200).json({ success: true, data: posts });
  } catch (err) {
    next(err);
  }
};

// @desc    Get related posts
// @route   GET /api/v1/posts/:id/related
// @access  Public
exports.getRelatedPosts = async (req, res, next) => {
  try {
    const basePost = await Post.findById(req.params.id);
    if (!basePost) return next(new ErrorResponse('Post not found', 404));

    const limit = parseInt(req.query.limit, 10) || 5;

    const query = {
      _id: { $ne: basePost._id },
      status: 'published',
      $or: [{ category: basePost.category }, { tags: { $in: basePost.tags } }],
    };

    const posts = await Post.find(query)
      .sort({ publishedAt: -1 })
      .limit(limit)
      .populate('author', 'name profileImage');

    res.status(200).json({ success: true, data: posts });
  } catch (err) {
    next(err);
  }
};

// ADMIN: create post
// @route   POST /api/v1/posts
// @access  Private/Admin or Publisher
exports.createPost = async (req, res, next) => {
  try {
    const data = {
      ...req.body,
      author: req.user._id,
    };

    const post = await Post.create(data);
    res.status(201).json({ success: true, data: post });
  } catch (err) {
    next(err);
  }
};

// ADMIN: update post
// @route   PUT /api/v1/posts/:id
// @access  Private/Admin or Publisher
exports.updatePost = async (req, res, next) => {
  try {
    let post = await Post.findById(req.params.id);
    if (!post) return next(new ErrorResponse('Post not found', 404));

    // if not admin, ensure user is the author
    if (req.user.role !== 'admin' && post.author.toString() !== req.user.id) {
      return next(new ErrorResponse('Not authorized to update this post', 403));
    }

    Object.assign(post, req.body);
    post = await post.save();

    res.status(200).json({ success: true, data: post });
  } catch (err) {
    next(err);
  }
};

// ADMIN: delete post
// @route   DELETE /api/v1/posts/:id
// @access  Private/Admin or Publisher
exports.deletePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return next(new ErrorResponse('Post not found', 404));

    if (req.user.role !== 'admin' && post.author.toString() !== req.user.id) {
      return next(new ErrorResponse('Not authorized to delete this post', 403));
    }

    await post.remove();
    res.status(200).json({ success: true, data: {} });
  } catch (err) {
    next(err);
  }
};

// @desc    Get featured posts
// @route   GET /api/v1/posts/featured
// @access  Public
exports.getFeaturedPosts = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 5;
    const posts = await Post.find({ status: 'published', featured: true })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('author', 'name profileImage')
      .populate('category', 'name slug');

    res.status(200).json({ success: true, data: posts });
  } catch (err) {
    next(err);
  }
};

// @desc    Increment post view count
// @route   POST /api/v1/posts/:id/view
// @access  Public
exports.incrementPostView = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return next(new ErrorResponse('Post not found', 404));
    }

    await post.incrementViewCount();

    res.status(200).json({ success: true, count: post.viewCount });
  } catch (err) {
    next(err);
  }
};

// @desc    Get posts by category slug
// @route   GET /api/v1/categories/:slug/posts
// @access  Public
exports.getPostsByCategorySlug = async (req, res, next) => {
  try {
    const category = await Category.findOne({ slug: req.params.slug });
    if (!category) return next(new ErrorResponse('Category not found', 404));

    const posts = await Post.find({ category: category._id, status: 'published' })
      .sort({ publishedAt: -1 })
      .populate('author', 'name profileImage');

    res.status(200).json({ success: true, data: posts });
  } catch (err) {
    next(err);
  }
};
