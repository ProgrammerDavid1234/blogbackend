const mongoose = require('mongoose');
const slugify = require('slugify');

const CategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a category name'],
    unique: true,
    trim: true,
    maxlength: [50, 'Name can not be more than 50 characters']
  },
  slug: String,
  description: {
    type: String,
    maxlength: [500, 'Description can not be more than 500 characters']
  },
  parent: {
    type: mongoose.Schema.ObjectId,
    ref: 'Category',
    default: null
  },
  featuredImage: {
    type: String,
    default: 'no-photo.jpg'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  seoTitle: String,
  seoDescription: String,
  seoKeywords: [String],
  displayOrder: {
    type: Number,
    default: 0
  },
  createdBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Create category slug from the name
CategorySchema.pre('save', function(next) {
  this.slug = slugify(this.name, { lower: true, strict: true });
  next();
});

// Prevent deleting category if it has posts
CategorySchema.pre('remove', async function(next) {
  const Post = this.model('Post');
  const posts = await Post.find({ category: this._id });
  
  if (posts.length > 0) {
    next(new Error('Cannot delete category with posts'));
  } else {
    next();
  }
});

// Cascade delete subcategories when a category is deleted
CategorySchema.pre('remove', async function(next) {
  await this.model('Category').deleteMany({ parent: this._id });
  next();
});

// Reverse populate with virtuals
CategorySchema.virtual('posts', {
  ref: 'Post',
  localField: '_id',
  foreignField: 'category',
  justOne: false
});

// Virtual for subcategories
CategorySchema.virtual('subcategories', {
  ref: 'Category',
  localField: '_id',
  foreignField: 'parent',
  justOne: false
});

// Get posts count for a category
CategorySchema.virtual('postCount', {
  ref: 'Post',
  localField: '_id',
  foreignField: 'category',
  count: true
});

// Static method to get categories with post count
CategorySchema.statics.getCategoriesWithCount = async function() {
  return this.aggregate([
    {
      $lookup: {
        from: 'posts',
        localField: '_id',
        foreignField: 'category',
        as: 'posts'
      }
    },
    {
      $project: {
        name: 1,
        slug: 1,
        description: 1,
        postCount: { $size: '$posts' },
        isActive: 1,
        displayOrder: 1
      }
    },
    { $sort: { displayOrder: 1, name: 1 } }
  ]);
};

// Static method to get category tree
CategorySchema.statics.getCategoryTree = async function() {
  const categories = await this.find({ isActive: true })
    .sort({ displayOrder: 1, name: 1 })
    .lean();
  
  const buildTree = (parentId = null) => {
    return categories
      .filter(cat => {
        if (parentId === null) return !cat.parent;
        return cat.parent && cat.parent.toString() === parentId.toString();
      })
      .map(cat => ({
        ...cat,
        children: buildTree(cat._id)
      }));
  };
  
  return buildTree();
};

// Static method to get all descendants of a category
CategorySchema.statics.getDescendants = async function(categoryId) {
  const categories = await this.find().lean();
  const descendants = [];
  
  const findDescendants = (parentId) => {
    const children = categories.filter(cat => 
      cat.parent && cat.parent.toString() === parentId.toString()
    );
    
    for (const child of children) {
      descendants.push(child._id);
      findDescendants(child._id);
    }
  };
  
  findDescendants(categoryId);
  return descendants;
};

// Static method to get breadcrumb for a category
CategorySchema.statics.getBreadcrumb = async function(categoryId) {
  const breadcrumb = [];
  
  const findParents = async (id) => {
    const category = await this.findById(id).select('name slug parent');
    if (category) {
      breadcrumb.unshift({
        name: category.name,
        slug: category.slug
      });
      
      if (category.parent) {
        await findParents(category.parent);
      }
    }
  };
  
  await findParents(categoryId);
  return breadcrumb;
};

// Create text index for search
CategorySchema.index({
  name: 'text',
  description: 'text',
  'seoKeywords': 'text'
});

// Create index for parent field for faster lookups
CategorySchema.index({ parent: 1 });

module.exports = mongoose.model('Category', CategorySchema);
